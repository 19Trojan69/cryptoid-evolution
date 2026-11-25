import { ObjectId } from "mongodb";

export interface UserData {
  _id: ObjectId,
  username: string,
  uid: string,
  roles: Array<string>,
  accessToken: string,
  notificationAuthByNetwork?: Partial<Record<import("../notificationSecurity").NotificationNetwork, import("../notificationSecurity").VerifiedNotificationIdentity | null>>,
}
