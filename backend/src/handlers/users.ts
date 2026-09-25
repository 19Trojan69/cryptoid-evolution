import { Router } from "express";

import platformAPIClient from "../services/platformAPIClient";

export default function mountUserEndpoints(router: Router) {
  const publicUser = (user: { uid: string; username: string; roles?: string[] }) => ({
    uid: user.uid,
    username: user.username,
    roles: Array.isArray(user.roles) ? user.roles : [],
  });

  // handle the user auth accordingly
  router.post("/signin", async (req, res) => {
    const auth = req.body?.authResult;
    const userCollection = req.app.locals.userCollection;

    if (!userCollection) {
      return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
    }
    if (!auth || typeof auth.accessToken !== "string" || !auth.accessToken) {
      return res.status(400).json({ error: "invalid_request", message: "Missing Pi access token" });
    }

    let verifiedUid: string;
    let verifiedUsername: string;
    let verifiedRoles: string[];
    try {
      // Verify the user's access token with the /me endpoint:
      const me = await platformAPIClient.get(`/v2/me`, { headers: { Authorization: `Bearer ${auth.accessToken}` } });
      verifiedUid = me.data.uid;
      if (!verifiedUid || (auth.user?.uid && verifiedUid !== auth.user.uid)) return res.status(401).json({ error: "invalid_token" });
      verifiedUsername = me.data.username;
      if (!verifiedUsername || typeof verifiedUsername !== "string") return res.status(401).json({ error: "invalid_token" });
      verifiedRoles = Array.isArray(auth.user?.roles) ? auth.user.roles : Array.isArray(me.data.roles) ? me.data.roles : [];
    } catch (err) {
      console.error("Error verifying access token:", err);
      return res.status(401).json({ error: "invalid_token", message: "Invalid access token" });
    }

    try {
      let currentUser = await userCollection.findOne({ uid: verifiedUid });

      if (currentUser) {
        await userCollection.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $set: {
              accessToken: auth.accessToken,
              username: verifiedUsername,
              ...(verifiedRoles.length ? { roles: verifiedRoles } : {}),
            },
          },
        );
        currentUser = await userCollection.findOne({ uid: verifiedUid });
      } else {
        const insertResult = await userCollection.insertOne({
          username: verifiedUsername,
          uid: verifiedUid,
          roles: verifiedRoles,
          accessToken: auth.accessToken,
        });

        currentUser = await userCollection.findOne(insertResult.insertedId);
      }

      if (!currentUser) return res.status(500).json({ error: "internal_error", message: "Failed to load signed-in user" });

      req.session.currentUser = currentUser;
      return res.status(200).json({ message: "User signed in", user: publicUser(currentUser) });
    } catch (err) {
      console.error("Error during signin:", err);
      return res.status(500).json({ error: "internal_error", message: "Failed to sign in" });
    }
  });

  router.get("/me", async (req, res) => {
    if (!req.session.currentUser) return res.status(401).json({ error: "not_authenticated" });
    return res.status(200).json({ user: publicUser(req.session.currentUser) });
  });

  // handle the user auth accordingly
  router.get("/signout", async (req, res) => {
    req.session.currentUser = null;
    return res.status(200).json({ message: "User signed out" });
  });
}
