// A stalled native Pi Browser bridge must not lock the app's sign-in controls.
// Ignore a late result after this deadline; only a new attempt may sign in.
export const PI_AUTH_TIMEOUT_MS = 60_000;

export async function withPiAuthTimeout<T>(operation: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Pi authentication timed out")), PI_AUTH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
