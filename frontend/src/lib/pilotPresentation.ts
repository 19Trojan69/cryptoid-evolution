export const badgeNames:Record<string,string>={'first-boss':'First boss','ten-bosses':'Ten bosses','perfect-formation':'Perfect formation','high-combo':'High combo','full-fleet':'Golden fleet','final-boss':'Galactic crown'};
export const countryFlag=(code:string)=>code.replace(/[A-Z]/g,c=>String.fromCodePoint(127397+c.charCodeAt(0)));
