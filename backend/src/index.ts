import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import logger from "morgan";
import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import env from "./environments";
import mountPaymentsEndpoints from "./handlers/payments";
import mountUserEndpoints from "./handlers/users";
import mountHangarEndpoints from "./handlers/hangar";
import mountLeaderboardEndpoints from "./handlers/leaderboard";
import mountRewardEndpoints from "./handlers/rewards";
import platformAPIClient from "./services/platformAPIClient";
import mountAdminEndpoints from "./handlers/admin";
import { restoreAdminPreview } from "./adminAccess";
import { collectUsage } from "./handlers/usage";
import mountProgressEndpoints from "./handlers/progress";

// We must import typedefs for ts-node-dev to pick them up when they change (even though tsc would supposedly
// have no problem here)
// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata#comment125163548_65381085
import "./types/session";
import mountNotificationEndpoints from "./handlers/notifications";

const dbName = env.mongo_db_name;
const mongoUri = env.mongo_uri || `mongodb://${env.mongo_host}/${dbName}`;
const mongoClientOptions = env.mongo_uri
  ? {}
  : {
      authSource: "admin",
      auth: {
        username: env.mongo_user,
        password: env.mongo_password,
      },
    };

//
// I. Initialize and set up the express app and various middlewares and packages:
//

export const app: express.Application = express();
app.set("trust proxy", 1);

// Log requests to the console in a compact format:
const skipUsage = (req: express.Request) => req.path === "/usage/collect";
app.use(logger("dev", { skip: skipUsage }));

// Vercel Functions have a read-only filesystem outside /tmp, so log to stdout there.
const accessLogStream = process.env.VERCEL
  ? process.stdout
  : fs.createWriteStream(path.join(__dirname, "..", "log", "access.log"), { flags: "a" });

app.use(
  logger("common", {
    stream: accessLogStream,
    skip: skipUsage,
  }),
);

// Enable response bodies to be sent as JSON:
app.use(express.json());

// Handle CORS:
app.use(
  cors({
    origin: env.frontend_url,
    credentials: true,
  }),
);

// Handle cookies 🍪
// Aggregate telemetry never passes through cookies, sessions or Pi auth.
app.post("/usage/collect", collectUsage);
app.use(cookieParser());

// Use sessions:
app.use(
  session({
    secret: env.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: Boolean(process.env.VERCEL) },
    store: MongoStore.create({
      mongoUrl: mongoUri,
      mongoOptions: mongoClientOptions,
      dbName,
      collectionName: "user_sessions",
    }),
  }) as unknown as express.RequestHandler,
);


// If a proxied Pi Browser request loses its session cookie, recover the
// authenticated user from the short-lived Pi access token sent by the client.
// The token is verified with Pi before any user is attached to the request.
app.use(async (req, _res, next) => {
  if (req.session.currentUser) return next();

  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1]?.trim();
  if (!accessToken) return next();

  const userCollection = req.app.locals.userCollection;
  if (!userCollection) return next();

  try {
    const me = await platformAPIClient.get("/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const uid = me.data?.uid;
    const username = me.data?.username;
    if (!uid || typeof uid !== "string" || !username || typeof username !== "string") return next();

    let currentUser = await userCollection.findOne({ uid });
    if (currentUser) {
      await userCollection.updateOne(
        { _id: currentUser._id },
        { $set: { username, accessToken } },
      );
      currentUser = await userCollection.findOne({ uid });
    } else {
      const inserted = await userCollection.insertOne({
        uid,
        username,
        roles: Array.isArray(me.data?.roles) ? me.data.roles : [],
        accessToken,
      });
      currentUser = await userCollection.findOne({ _id: inserted.insertedId });
    }

    if (currentUser) {
      req.session.currentUser = currentUser;
      req.session.adminMode = false;
      req.session.adminUid = null;
      req.session.adminLoadout = null;
      req.session.scoreRun = null;
    }
  } catch (error) {
    console.warn("Pi session rehydration failed", error instanceof Error ? error.message : "unknown error");
  }

  return next();
});

app.use(restoreAdminPreview);

const adminRouter = express.Router();
mountAdminEndpoints(adminRouter);
app.use("/admin", adminRouter);

//
// II. Mount app endpoints:
//

// Payments endpoint under /payments:
const paymentsRouter = express.Router();
mountPaymentsEndpoints(paymentsRouter);
app.use("/payments", paymentsRouter);

const hangarRouter = express.Router();
mountHangarEndpoints(hangarRouter);
app.use("/hangar", hangarRouter);
const progressRouter = express.Router();
mountProgressEndpoints(progressRouter);
app.use("/progress", progressRouter);

const leaderboardRouter = express.Router();
mountLeaderboardEndpoints(leaderboardRouter);
app.use("/leaderboard", leaderboardRouter);

const rewardsRouter = express.Router();
mountRewardEndpoints(rewardsRouter);
app.use("/rewards", rewardsRouter);

// User endpoints (e.g signin, signout) under /user:
const userRouter = express.Router();
mountUserEndpoints(userRouter);
app.use("/user", userRouter);

// Notification endpoints under /notifications:
const notificationRouter = express.Router();
mountNotificationEndpoints(notificationRouter);
app.use("/notifications", notificationRouter);

// Hello World page to check everything works:
app.get("/", async (_, res) => {
  res.status(200).send({ message: "Hello, World!" });
});

// III. Connect to MongoDB and optionally start the local HTTP server:
export const start = async (listen = true): Promise<void> => {
  try {
    const client = await MongoClient.connect(mongoUri, mongoClientOptions);
    const db = client.db(dbName);
    app.locals.orderCollection = db.collection("orders");
    app.locals.userCollection = db.collection("users");
    app.locals.adminCollection = db.collection("admin_access");
    app.locals.usageCollection = db.collection("usage_hourly");
    await app.locals.usageCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await app.locals.usageCollection.createIndex({ network: 1, hour: -1 });
    await app.locals.orderCollection.createIndex({ pi_payment_id: 1 }, { unique: true });
    await app.locals.orderCollection.createIndex({ payment_network: 1, created_at: -1 });
    await app.locals.userCollection.createIndex({ bestScore: -1, uid: 1 });
    await app.locals.userCollection.createIndex({ "bestScoreV2.testnet": -1, uid: 1 });
    await app.locals.userCollection.createIndex({ "bestScoreV2.mainnet": -1, uid: 1 });
    console.log("Connected to MongoDB");

    if (listen) {
      app.listen(env.port, () => {
        console.log(`Cryptoid Evolution backend listening on port ${env.port}!`);
        console.log(`CORS config: configured to respond to a frontend hosted on ${env.frontend_url}`);
      });
    }
  } catch (err) {
    console.error("Connection to MongoDB failed: ", err);
    if (process.env.VERCEL) throw err;
    process.exit(1);
  }
};

if (!process.env.VERCEL) void start();
