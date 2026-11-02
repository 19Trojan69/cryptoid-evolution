type Gap = { frame: number; time: number; gap: number; status: string | null; priorStatus: string | null };
type Snapshot = { generation: number; frames: number; playingFrames: number; lastFrameAt: number | null; lastStatus: string | null; maxPlayingGapMs: number; gaps: Gap[] };
export function createFrameProbe(): { record(time: number, gap: number, status: string): void; read(): Snapshot };
