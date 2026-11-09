import { pointsPerDock, withDockingSurvival } from "./galaxyArcadeDocking";
import { arcadeLevelProgress, withArcadeDifficulty } from "./galaxyArcadeDifficulty";

const levelStyles = `<style>
  #runLevel {
    color: var(--arcade-accent, #8af6d1);
    font: 700 11px/1.25 var(--mono);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  #levelBanner {
    position: absolute;
    top: 11%;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    border: 2px solid var(--arcade-accent, #8af6d1);
    background: #0b1427;
    color: var(--arcade-accent, #8af6d1);
    font: 800 clamp(17px, 5vmin, 26px)/1.2 var(--mono);
    letter-spacing: .07em;
    text-transform: uppercase;
    white-space: nowrap;
    pointer-events: none;
  }
  body:not(.locked) #levelBanner { display: none; }
</style>`;

const survivalRules = `
  ${arcadeLevelProgress}
  const survival = {
    create(module, v, previous) {
      const section = previous ? previous.section + 1 : 1;
      const seed = previous ? Math.imul(section, 0x9E3779B1) + v * 197 : undefined;
      const next = module.create(v, seed);
      Object.assign(next, {
        section,
        challenge: C.levelProgress(section),
        maxHits: 3,
        hits: previous?.hits ?? 0,
        inv: previous?.inv ?? 0,
        bankedScore: previous ? previous.bankedScore + previous.score : 0,
        bankedTime: previous ? previous.bankedTime + previous.elapsed : 0,
        cleared: previous ? previous.cleared + Number(previous.success) : 0,
      });
      if(previous) {
        next.rng = C.random(seed);
        if(next.patrol) next.patrol.rng = C.random(seed + 8327);
        // A clean wave can begin in place. A failed objective restarts from the safe entry.
        if(previous.success && selected.id !== 'G07') {
          next.x = previous.x;
          next.y = previous.y;
          if(next.patrol) Object.assign(next.patrol, { lastX: next.x, lastY: next.y });
        }
        if(previous.success && next.cursor) next.cursor = previous.cursor;
      }
      return next;
    },
    update(session, dt, controls) {
      const {module, state} = session;
      if(state.done) return;
      const hitsBefore = state.hits;
      module.update(state, dt, controls);
      if(!state.done) return;

      const friendlyFireAlreadyCharged = selected.id === 'G05' && state.v === 3
        && state.friendlyHits > 0 && state.hitsOnTarget >= state.goal;
      if(state.hits < state.maxHits && !state.success && state.hits === hitsBefore && !friendlyFireAlreadyCharged) {
        state.done = false;
        state.inv = 0;
        C.damage(state);
      }
      if(state.hits >= state.maxHits) {
        state.done = true;
        state.success = false;
        state.message = 'Alle drei Leben aufgebraucht.';
        return;
      }
      session.state = this.create(module, state.v, state);
      C.notice(state.success ? 'LEVEL GESCHAFFT' : 'LEVELZIEL VERFEHLT', 240, 158, state.success ? '#b7f8f2' : '#ffcaaf');
    },
    showLevel(state) {
      const label = 'Level ' + state.section;
      const badge = $('runLevel');
      const banner = $('levelBanner');
      if (badge.textContent !== label) {
        badge.textContent = label;
        banner.textContent = label;
      }
      banner.hidden = C.mode !== 'running' || state.done || state.elapsed - (state.bayOpenedAt ?? 0) >= 1.6;
    },
    score(state) {
      return state.bankedScore + state.score;
    },
    metrics(id, state) {
      const time = Math.floor(state.bankedTime + state.elapsed);
      const duration = Math.floor(time / 60) + ':' + String(time % 60).padStart(2, '0');
      return [['Erreichtes Level', state.section],
        [id === 'G03' ? 'Andockmanöver' : 'Level geschafft', id === 'G03' ? state.docks : state.cleared],
        ['Flugzeit', duration]];
    },
  };
`;

const survivalGoals: Readonly<Record<string, string>> = {
  "1-1": "Sammle Cyan-Shards für 10 und Gold-Shards für 25 Punkte. Weiche Hindernissen aus und überstehe möglichst viele Flugabschnitte.",
  "1-5": "Sammle mindestens 24 Shards in jedem Flugabschnitt. Weiche den angekündigten Schüssen der Fernpatrouillen aus.",
  "3-4": "Pro Bucht stehen dir 24 Steuerimpulse zur Verfügung. Wenn sie aufgebraucht sind, lädt alle zwei Sekunden ein einzelner Impuls nach. Bremse und Drehung bleiben verfügbar.",
  "3-5": "Bediene die Andockbuchten nacheinander. Bremse, richte dein Schiff aus und halte es eine Sekunde stabil in der Bucht.",
  "5-1": "Triff pro Abschnitt mindestens zehn unterschiedlich große Übungsziele.",
  "5-3": "Triff pro Abschnitt acht Feinde und verschone alle mit FREUND markierten Objekte. Jeder Freundtreffer kostet ein Leben.",
  "5-4": "Erziele mit zwölf Schüssen mindestens neun Treffer und 70 Prozent Präzision. Die Munition wird für den nächsten Abschnitt aufgefüllt.",
  "6-1": "Fange pro Abschnitt mindestens zehn echte Raketen ab und schütze die Station. Jeder echte Einschlag kostet ein Leben.",
  "6-5": "Fange mit zwölf Abfangladungen pro Abschnitt mindestens zwölf Raketen ab. Nutze Explosionen zwischen zusammen fliegenden Raketen.",
};

export function withArcadeSurvival(html: string, game: number, variant: number) {
  const docking = game === 3;
  const goal = survivalGoals[`${game}-${variant}`];
  const sectionRule = docking
    ? "Nach dem automatischen Ablegen beginnt ein neues Level an der nächsten Bucht. Jede Bucht verlangt mehr Präzision. Harte Karambolagen kosten ein Leben."
    : "Mit jedem Abschnitt steigt das Level und die Aufgabe wird schwieriger. Treffer oder ein verfehltes Levelziel können ein Leben kosten.";
  const scoring = docking
    ? `${pointsPerDock} Punkte pro erfolgreichem Andockmanöver.`
    : game === 5 && variant === 4
      ? "50 pro Treffer + 150 Auftragsbonus. Zwölf Schüsse pro Abschnitt."
      : game === 6 && variant === 5
        ? "40 pro Abfangziel + 150 Auftragsbonus. Zwölf Ladungen pro Abschnitt."
        : undefined;
  const briefing = {
    ...(goal ? { goal } : {}),
    ...(scoring ? { scoring } : {}),
    rulesVersion: "survival-levels-1",
  };

  let document = (docking ? withDockingSurvival(html) : withArcadeDifficulty(html, game))
    .replace("</head>", `${levelStyles}</head>`)
    .replace('<small id="roundId"></small>', '<small id="roundId" hidden></small><span id="runLevel" role="status"></span>')
    .replace('</canvas></section>', '</canvas><div id="levelBanner" aria-hidden="true" hidden></div></section>')
    .replace(
      "function intro(v){",
      `${survivalRules}
      Object.assign(C.catalog[${game - 1}].variants[${variant - 1}], ${JSON.stringify(briefing)});
      function intro(v){`,
    )
    .replace("Bis 60 Sekunden · ${selectedVariant.difficulty}", "Überlebensmodus · 3 Leben")
    .replace(
      '${selectedVariant.goal}</p><div class="briefing-controls">',
      `\${selectedVariant.goal} ${sectionRule} Das Spiel läuft, bis alle drei Leben aufgebraucht sind.</p><div class="briefing-controls">`,
    )
    .replace(
      /const protection=m\.protection[^;]+;/,
      "const protection='Drei Leben für den gesamten Lauf. Punkte aus den Abschnitten werden addiert.';",
    )
    .replace("state:m.create(v)", "state:survival.create(m,v)")
    .replace("state:C.modules[selected.id].create(selectedVariant.number)", "state:survival.create(C.modules[selected.id],selectedVariant.number)")
    .replace("C.session.module.update(C.session.state,1/60,i);", "survival.update(C.session,1/60,i);")
    .replace("Math.round(s.score)),recordKey=", "Math.round(survival.score(s))),recordKey=")
    .replace("s.score=score;let saved=true;", "let saved=true;")
    .replace("metrics=C.reviewRound?.(selected.id,s)||[];", "metrics=survival.metrics(selected.id,s);")
    .replace("Bestwert dieser Variante", "Bestwert im Levelmodus")
    .replace("'LETZTER ABSCHNITT'", "'SEKTORWECHSEL NAHT'")
    .replace("Flugprotokoll und Wertung", docking ? "Flugprotokoll und Wertung" : "Letzter Abschnitt und Wertung")
    .replace("$('score').textContent=Math.max(0,Math.floor(s.score));", "survival.showLevel(s);$('score').textContent=Math.max(0,Math.floor(survival.score(s)));")
    .replace("$('healthLabel').textContent=C.session.module.healthLabel||'SCHUTZLADUNGEN';", "$('healthLabel').textContent='LEBEN';")
    .replace("C.session.module.health?C.session.module.health(s):", "");
  if (docking) {
    document = document
      .replace('<small>RESTZEIT</small><b id="time" class="cyan">60 s</b>', '<small>ANDOCKBUCHT</small><b id="time" class="cyan">1</b>')
      .replace("$('time').textContent=Math.ceil(s.time)+' s';", "$('time').textContent=s.section;")
      .replace("$('timeMeter').style.width=(s.time/60*100)+'%';", "$('timeMeter').style.width=(s.releaseUntil?100:s.dwell*100)+'%';");
  }
  if (game === 5 && variant === 3) {
    document = document.replace(
      "if(s.friendlyHits>=3)O.finish(s,false,'Drei verbündete Ziele getroffen.');",
      "s.inv=0;C.damage(s,t.x,t.y);",
    );
  }
  return document;
}
