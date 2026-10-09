/** Original cosmetic insignia, stable per hull/boss; no gameplay effects. */
export const factionEmblem = (key: string) => `/emblems/faction-${Array.from(key.replace(/-[123]$/, '')).reduce((n,c)=>n+c.charCodeAt(0),0)%4}.svg`;
