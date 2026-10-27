// Active playing time, shared by the phase deadlines and their native notices.
export const TRANSITION_INTRO_MS = 4_800;
export const BLOCK_CLEAR_MS = 5_200;

// Reinforcements are a separate short lead-in inside an existing block. Keep
// their released timing rather than adding a full block title before each flight.
export const reinforcementIntroMs = (stage: number) => stage <= 29 ? 550 : 850;
