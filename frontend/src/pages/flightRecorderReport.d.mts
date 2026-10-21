import type { TimingCapture } from './timingReport.mjs';
export const FLIGHT_RECORDER_KEY: string;
export const PREVIOUS_FLIGHT_RECORDER_KEY: string;
export const FLIGHT_RECORDER_MAX_CHARS: number;
export type FlightRecorder = TimingCapture & { mode: string; savedAt: number };
export function cleanFlightRecorder(input: unknown): FlightRecorder | null;
export function readFlightRecorders(host: { localStorage?: Pick<Storage,'getItem'>; sessionStorage?: Pick<Storage,'getItem'> }): FlightRecorder[];
