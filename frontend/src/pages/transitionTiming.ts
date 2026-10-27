// Active playing time, shared by the phase deadlines and their native notices.
export const TRANSITION_INTRO_MS = 4_800;
export const BLOCK_CLEAR_MS = 5_200;

// Reinforcement warnings get their own protected reading phase. Flight entry,
// spawn spacing and combat cadence after that warning retain their own timing.
export const reinforcementIntroMs = () => TRANSITION_INTRO_MS;
export const COMBAT_NOTICE_MS = 4_800;

// Extra reading never brings a drop or rock due earlier on the event clock.
export const releasedIntroClockMs = (stage: number) => stage <= 29 ? 550 : 850;
