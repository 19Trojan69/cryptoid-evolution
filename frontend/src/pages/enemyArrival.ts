// Explicit device-test request: 25% less arrival speed than the tested build.
// Distance/time: multiplying duration by 1/.75 preserves the flight path.
export const slowerEnemyArrival = (duration: number) => Math.round(duration / .75);
export const bossEscortVisualScale = (escort: boolean | undefined) => escort ? 1.25 : 1;
export function restoreSlowerArrival<T extends {entryDuration:number;entryElapsed:number}>(enemy:T, previousDuration:number, olderDuration?:number):T {
 if(enemy.entryDuration!==previousDuration&&enemy.entryDuration!==olderDuration)return enemy;
 const duration=slowerEnemyArrival(previousDuration);
 const elapsed=enemy.entryElapsed<enemy.entryDuration?enemy.entryElapsed*duration/enemy.entryDuration:enemy.entryElapsed+duration-enemy.entryDuration;
 return {...enemy,entryDuration:duration,entryElapsed:elapsed};
}
