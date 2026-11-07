import { UserData } from "./user";

declare module 'express-serve-static-core' {
  export interface Request {
    // Set by the Testnet gateway after selecting the local save handler.
    testnetSave?: true;
  }
}

// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata
declare module 'express-session' {
  export interface SessionData {
    currentUser: UserData | null,
    scoreRun?: { rulesVersion?: 1 | 2; id: string; startedAt: number; scoreBase?: number; shardsBase?: number; unlockedWeaponLevels?: number[] } | null,
    adminMode?: boolean,
    adminUid?: string | null,
    adminLoadout?: { weapon: string | null; power: string | null } | null,
  }
}
