import { Router } from "express";
import { canAdmin } from "../adminAccess";
import {
  claimNotificationDispatch, currentNotificationIdentity, notificationClient,
  notificationContext, notificationServerNetwork, parseNotificationRequest,
} from "../notificationSecurity";

export default function mountNotificationEndpoints(router: Router) {
  router.post("/send", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const user = req.session?.currentUser;
    if (!user?.uid) return res.status(401).json({ error: "not_authenticated" });
    const bearer = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (bearer && bearer !== user.accessToken) return res.status(401).json({ error: "notification_signin_required" });

    try {
      const network = req.notificationNetwork ?? notificationServerNetwork();
      if (!network) return res.status(503).json({ error: "notification_network_unconfigured" });
      // Select the existing verified-owner binding using trusted server context.
      const ownerRequest = Object.assign(Object.create(req), { headers: { ...req.headers, "x-cryptoid-app-network": network } });
      if (!await canAdmin(ownerRequest)) return res.status(403).json({ error: "not_authorized" });
      const context = notificationContext(req);
      if (!context || process.env.CRYPTOID_NOTIFICATIONS_ENABLED !== "1")
        return res.status(503).json({ error: "notifications_unconfigured" });
      if (!currentNotificationIdentity(user, context)) return res.status(401).json({ error: "notification_signin_required" });

      const request = parseNotificationRequest(req.body);
      if (!request) return res.status(400).json({ error: "invalid_notifications" });
      const { userCollection, adminCollection } = req.app.locals;
      if (!userCollection || !adminCollection) return res.status(503).json({ error: "notification_storage_unavailable" });
      for (const notification of request.notifications) {
        const recipient = await userCollection.findOne({ uid: notification.user_uid });
        const identity = currentNotificationIdentity(recipient, context);
        if (!identity?.scopes.includes("in_app_notifications"))
          return res.status(403).json({ error: "notification_recipient_not_consented" });
      }
      const claim = await claimNotificationDispatch(adminCollection, context, request);
      if (claim === "duplicate") return res.status(409).json({ error: "notification_request_already_claimed" });
      if (claim === "limited") return res.status(429).json({ error: "notification_rate_limited" });

      // All access, consent, environment and durable admission checks precede Pi.
      const response = await notificationClient(context).post("/v2/in_app_notifications/notify", { notifications: request.notifications });
      if (response.status !== 201 || response.data?.success !== true || !Array.isArray(response.data?.delivered_notifications))
        return res.status(502).json({ error: "notification_delivery_unconfirmed" });
      const recipients = new Set(request.notifications.map(item => item.user_uid));
      const delivered = new Set(response.data.delivered_notifications
        .filter((item: any) => typeof item?.user_uid === "string" && recipients.has(item.user_uid))
        .map((item: any) => item.user_uid)).size;
      return res.status(201).json({ requested: request.notifications.length, delivered });
    } catch {
      // Axios errors can contain the API key. Never forward or log them here.
      // Claims stay consumed on uncertainty: retries must not duplicate delivery.
      return res.status(503).json({ error: "notification_dispatch_unavailable" });
    }
  });
}
