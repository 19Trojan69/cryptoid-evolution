type StationMedal = {
  metric: string;
  label: string;
  goals: readonly [number, number, number, number, number, number];
  divisor?: number;
  best?: boolean;
};

// Each row follows the five stations of its game in map order. Goals run from Copper to Diamond.
const stationMedals: readonly (readonly StationMedal[])[] = [
  [
    { metric: "collected", label: "Gesammelte Shards", goals: [12, 18, 28, 40, 54, 70] },
    { metric: "chains", label: "Vollständige Viererketten", goals: [1, 2, 3, 5, 7, 9] },
    { metric: "magnetCollected", label: "Mit dem Magneten gesammelte Shards", goals: [3, 5, 8, 12, 16, 22] },
    { metric: "riskCores", label: "Geborgene Goldkerne", goals: [2, 3, 5, 8, 11, 15] },
    { metric: "clear", label: "Erfüllte Lieferaufträge", goals: [1, 2, 3, 4, 5, 6] },
  ],
  [
    { metric: "elapsed", label: "Überlebte Sekunden", goals: [25, 45, 70, 100, 135, 170] },
    { metric: "frontBonus", divisor: 60, label: "Gemiedene Meteorfronten", goals: [2, 3, 5, 8, 11, 14] },
    { metric: "swirlPassages", label: "Vollständige Wirbelpassagen", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "boostDodges", label: "Gelungene Schub-Ausweichmanöver", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "zoneBonus", divisor: 60, label: "Im sicheren Bereich durchflogene Engstellen", goals: [1, 2, 3, 5, 7, 9] },
  ],
  [
    { metric: "docks", label: "Sichere Andockmanöver an der Station", goals: [1, 2, 3, 5, 7, 9] },
    { metric: "docks", label: "Andockmanöver an drehenden Buchten", goals: [1, 2, 3, 4, 6, 8] },
    { metric: "docks", label: "Andockmanöver am beweglichen Frachter", goals: [1, 2, 3, 4, 6, 8] },
    { metric: "docks", label: "Andockmanöver mit Impulssteuerung", goals: [1, 2, 3, 4, 6, 8] },
    { metric: "docks", label: "Erledigte Andockaufträge", goals: [1, 2, 3, 5, 7, 9] },
  ],
  [
    { metric: "passed", label: "Durchflogene Ringe", goals: [5, 8, 13, 19, 25, 32] },
    { metric: "precise", label: "Mittig passierte Wanderringe", goals: [3, 4, 7, 10, 14, 18] },
    { metric: "passed", label: "Durchflüge durch offene Phasenringe", goals: [4, 7, 12, 17, 23, 30] },
    { metric: "riskyPasses", label: "Passagen durch schmale Tore", goals: [3, 4, 7, 10, 14, 18] },
    { metric: "bestCombo", best: true, label: "Mittige Durchflüge in Folge", goals: [2, 3, 4, 6, 8, 10] },
  ],
  [
    { metric: "hitsOnTarget", label: "Getroffene Zielscheiben", goals: [5, 8, 13, 19, 26, 34] },
    { metric: "hitsOnTarget", label: "Getroffene bewegliche Drohnen", goals: [4, 7, 12, 17, 23, 30] },
    { metric: "clear", label: "Erfüllte Aufträge ohne Freundtreffer", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "clear", label: "Erfüllte Aufträge mit begrenzter Munition", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "hitsOnTarget", label: "Kerntreffer bei offener Panzerung", goals: [3, 5, 8, 12, 17, 22] },
  ],
  [
    { metric: "intercepted", label: "Abgefangene Einzelraketen", goals: [5, 8, 13, 19, 25, 33] },
    { metric: "intercepted", label: "Abgefangene Raketen aus geteilten Salven", goals: [7, 11, 17, 25, 34, 43] },
    { metric: "intercepted", label: "Abgefangene Raketen im Explosionsfeld", goals: [10, 15, 24, 36, 48, 60] },
    { metric: "cleanDefense", label: "Erfüllte Abwehraufträge ohne Täuschkörpertreffer", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "clear", label: "Erfüllte Aufträge mit zwölf Abfangladungen", goals: [1, 2, 3, 4, 5, 6] },
  ],
  [
    { metric: "rescued", label: "Einzeln abgelieferte Rettungskapseln", goals: [2, 3, 5, 8, 11, 14] },
    { metric: "rescued", label: "Trotz begrenztem Platz gerettete Kapseln", goals: [3, 5, 8, 12, 16, 21] },
    { metric: "rescued", label: "Bei Sauerstoffknappheit gerettete Kapseln", goals: [2, 4, 7, 10, 14, 18] },
    { metric: "rescued", label: "Sicher durch die Trümmer gebrachte Kapseln", goals: [2, 3, 5, 7, 10, 12] },
    { metric: "rescued", label: "An der wandernden Basis abgelieferte Kapseln", goals: [2, 4, 7, 10, 14, 17] },
  ],
  [
    { metric: "clear", label: "Erfolgreiche Eskorten eines Frachters", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "clear", label: "Erfolgreiche Eskorten aller drei Frachter", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "blocked", label: "Mit dem Schild abgefangene Schüsse", goals: [2, 3, 5, 8, 11, 15] },
    { metric: "clear", label: "Erfolgreiche Eskorten durch Hinterhalte", goals: [1, 2, 3, 4, 5, 6] },
    { metric: "clear", label: "Erfolgreiche Eskorten des beschädigten Konvois", goals: [1, 2, 3, 4, 5, 6] },
  ],
];

const medalStyle = `<style>
  .medal-goals { display: grid; gap: 6px; }
  .medal-goals p { color: #e4edf9; font-size: 13px; }
  .medal-targets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin: 0; }
  .medal-targets div { border: 1px solid #4a567f; background: #1b2442; padding: 4px 2px; text-align: center; }
  .medal-targets dt { color: #ced9ed; font-size: 10px; }
  .medal-targets dd { color: #e7efff; font: 700 16px var(--mono); margin: 0; }
  .medal-targets [data-earned] { border-color: var(--rank-color); }
  .medal-targets [data-earned] dd { color: var(--rank-color); }
  .medal-targets [data-rank="1"] { --rank-color: #ffb095; }
  .medal-targets [data-rank="2"] { --rank-color: #ead08a; }
  .medal-targets [data-rank="3"] { --rank-color: #dce5f3; }
  .medal-targets [data-rank="4"] { --rank-color: #ffd36c; }
  .medal-targets [data-rank="5"] { --rank-color: #b7ddd8; }
  .medal-targets [data-rank="6"] { --rank-color: #98edff; }
  #resultMessage:not([hidden]) { color: #adf4e1; }
  #resultMessage[data-save-error]:not([hidden]) { color: #ffc6ad; }
  .medal-result { padding: 7px 9px; border: 1px solid #4a567f; }
</style>`;

export function arcadeMedalConfiguration(game: number, variant: number) {
  return stationMedals[game - 1][variant - 1];
}

export function arcadeMedalRules(game: number, variant: number) {
  return `
  const medal = ${JSON.stringify(arcadeMedalConfiguration(game, variant))};
  const medalNames = ['Kupfer', 'Messing', 'Silber', 'Gold', 'Platin', 'Diamant'];
  function medalValue(s) {
    const completed = s.done && s.success;
    const current = medal.metric === 'clear' ? Number(completed)
      : medal.metric === 'cleanDefense' ? Number(completed && s.decoys === 0)
      : (s[medal.metric] ?? 0) / (medal.divisor ?? 1);
    return medal.best ? Math.max(s.medalBank, current) : s.medalBank + current;
  }
  function medalTier(value) {
    return medal.goals.reduce((tier, goal) => tier + Number(value >= goal), 0);
  }
  function announceMedal(s) {
    if(s.medalTier === medal.goals.length) return;
    const tier = medalTier(medalValue(s));
    if(tier > s.medalTier) {
      s.medalTier = tier;
      C.notice(medalNames[tier - 1].toUpperCase() + ' ERREICHT', 240, 212, '#ffd894');
    }
  }
  function renderMedalGoals(s) {
    const progress = s ? Math.floor(medalValue(s)) : 0;
    const tier = medalTier(progress);
    const goals = medal.goals.map((goal,index) => '<div data-rank="'+(index+1)+'"'+(tier>index?' data-earned':'')+'><dt>'+medalNames[index]+'</dt><dd>'+goal+'</dd></div>').join('');
    const content = '<p>'+medal.label+(s?' · <strong>'+progress+'</strong>':'')+'</p><dl class="medal-targets">'+goals+'</dl>';
    if(s) return '<section class="medal-goals medal-result" aria-label="Rangziele"><b>'+(tier?medalNames[tier-1]+' erreicht':'Rangziele')+'</b>'+content+'</section>';
    return '<details class="briefing-extra"><summary>Rangziele</summary><div class="medal-goals">'+content+'</div></details>';
  }`;
}

export function withArcadeMedals(html: string, game: number) {
  let document = html
    .replace("</head>", `${medalStyle}</head>`)
    .replace('<button class="primary" id="startRound">', '${renderMedalGoals()}<button class="primary" id="startRound">')
    .replace('<p id="resultMessage"></p>', '<p id="resultMessage"></p>${renderMedalGoals(s)}')
    .replace(",rank=score>=400?3:score>=220?2:score>=80?1:0", "")
    .replace(/[$]\{selected\.id==='G01'&&selectedVariant\.number===1\?`<div class="result-stars"[^\n]+?<\/div>`:''\}/, "");
  if (game === 1) {
    document = document
      .replace("collected:0,missed:0", "collected:0,magnetCollected:0,riskCores:0,missed:0")
      .replace("o.x+=(s.x-o.x)/d*speed;", "o.magnetPulled=true;o.x+=(s.x-o.x)/d*speed;")
      .replace("s.score+=o.value;s.collected++;", "s.score+=o.value;s.collected++;if(o.magnetPulled)s.magnetCollected++;if(s.v===4&&o.value===75)s.riskCores++;");
  }
  if (game === 4) {
    document = document
      .replace("resolved:0,combo:0,precise:0", "resolved:0,combo:0,bestCombo:0,precise:0,riskyPasses:0")
      .replace("good=true;bonus=gate.value;break;", "good=true;bonus=gate.value;if(bonus===100)s.riskyPasses++;break;")
      .replace("s.combo++;bonus+=25*s.combo;", "s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);bonus+=25*s.combo;");
  }
  return document;
}
