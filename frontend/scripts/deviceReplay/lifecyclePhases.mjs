// Same weapon/shield workload around real destruction and block transitions.
export const LIFECYCLE_PHASES = [
  {name:'double-six-reference',label:'Vergleich vor den Explosionen',enemies:6,double:true,shield:true,durationMs:20000,fixture:'fixed'},
  {name:'destruction-refill',label:'Gegnerzerstörung und Explosionen',enemies:6,double:true,shield:true,durationMs:30000,fixture:'destruction'},
  {name:'normal-block-transitions',label:'Automatische Blockwechsel',enemies:6,double:true,shield:true,durationMs:40000,fixture:'transitions'},
  {name:'double-six-after',label:'Vergleich nach den Blockwechseln',enemies:6,double:true,shield:true,durationMs:20000,fixture:'fixed'},
];
