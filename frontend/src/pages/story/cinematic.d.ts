export type StoryTiming = {
  duration: number;
  groups: { kind: string; words: { text: string; start: number; end: number }[] }[];
};
export function createCinematic(
  context: CanvasRenderingContext2D,
  assets: {
    nebula: HTMLImageElement;
    ship?: HTMLImageElement;
    outline?: HTMLImageElement;
    muzzles?: { x: number; y: number; dx: number; dy: number; color: string; interval: number }[];
  },
  timing: StoryTiming,
  surface: (width: number, height: number) => HTMLCanvasElement,
): { resize(width: number, height: number): void; draw(seconds: number, reducedMotion: boolean, unlocked: boolean): void; dispose(): void };
