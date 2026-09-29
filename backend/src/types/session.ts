import { UserData } from "./user";

// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata
declare module 'express-session' {
  export interface SessionData {
    currentUser: UserData | null,
    scoreRun?: { id: string; startedAt: number } | null,
    adminMode?: boolean,
    adminLoadout?: { weapon: string | null; power: string | null } | null,
  }
}
