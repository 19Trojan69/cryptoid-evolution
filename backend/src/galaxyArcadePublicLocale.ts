import { arcadeStationCopy, arcadeTerms } from "./galaxyArcadeCopy";
import { arcadeWords, type ArcadeLocale } from "./galaxyArcadeLanguages";

const hints: Record<ArcadeLocale, readonly [string, string, string, string, string]> = {
  en: ["Each section raises the level and difficulty.", "Use Boost to dash in the last direction you steered.", "Brake, turn, and hold still in the bay for one second.", "Fly through only when the gate is open.", "Avoid friendly targets. Each friendly hit costs a life."],
  de: ["Mit jedem Abschnitt steigen Level und Schwierigkeit.", "Mit Schub sprintest du in die zuletzt gesteuerte Richtung.", "Bremse, richte das Schiff aus und halte es eine Sekunde in der Bucht.", "Fliege nur durch, wenn das Tor offen ist.", "Verschone Verbündete. Jeder Freundtreffer kostet ein Leben."],
  es: ["Con cada tramo suben el nivel y la dificultad.", "Usa el impulso para acelerar en la última dirección elegida.", "Frena, gira y mantén la posición un segundo en la bahía.", "Atraviesa solo cuando la puerta esté abierta.", "Evita a los aliados. Cada impacto aliado cuesta una vida."],
  fr: ["Chaque section augmente le niveau et la difficulté.", "Utilisez l’impulsion pour accélérer dans la dernière direction choisie.", "Freinez, tournez et maintenez la position une seconde dans la baie.", "Passez seulement quand la porte est ouverte.", "Épargnez les alliés. Chaque tir allié coûte une vie."],
  pt: ["Cada secção aumenta o nível e a dificuldade.", "Usa o impulso para acelerar na última direção escolhida.", "Trava, roda e mantém a posição um segundo na baía.", "Passa apenas quando a porta estiver aberta.", "Evita os aliados. Cada acerto num aliado custa uma vida."],
  it: ["Ogni sezione aumenta il livello e la difficoltà.", "Usa la spinta per scattare nell’ultima direzione scelta.", "Frena, ruota e resta fermo nella baia per un secondo.", "Passa solo quando il varco è aperto.", "Evita gli alleati. Ogni colpo su un alleato costa una vita."],
  pl: ["Każdy odcinek podnosi poziom i trudność.", "Użyj przyspieszenia, by wykonać zryw w ostatnim kierunku ruchu.", "Zahamuj, obróć się i utrzymaj pozycję w zatoce przez sekundę.", "Przelatuj tylko wtedy, gdy brama jest otwarta.", "Omijaj sojuszników. Każde trafienie sojusznika kosztuje życie."],
  tr: ["Her bölümde seviye ve zorluk artar.", "Son yöneldiğin tarafa atılmak için itkiyi kullan.", "Frenle, dön ve yuvada bir saniye konumunu koru.", "Yalnızca geçit açıkken geç.", "Dost hedeflerden kaçın. Her dost isabeti bir can götürür."],
  ru: ["С каждым участком растут уровень и сложность.", "Ускоряйся в последнем выбранном направлении.", "Затормози, развернись и удерживай положение в отсеке одну секунду.", "Пролетай, только когда ворота открыты.", "Не задевай союзников. Каждое попадание по союзнику стоит жизни."],
  hr: ["Svaka dionica povećava razinu i težinu.", "Potiskom ubrzaj u zadnjem smjeru kretanja.", "Zakoči, okreni se i zadrži položaj u pristaništu jednu sekundu.", "Proleti samo dok je prolaz otvoren.", "Poštedi saveznike. Svaki pogodak saveznika košta jedan život."],
  cs: ["Každý úsek zvyšuje úroveň i obtížnost.", "Zrychli v posledním směru letu.", "Zabrzdi, otoč se a vydrž v doku jednu sekundu.", "Proleť, jen když je brána otevřená.", "Vyhýbej se spojencům. Každý zásah spojence stojí život."],
  sk: ["Každý úsek zvyšuje úroveň aj obtiažnosť.", "Zrýchli v poslednom smere letu.", "Zabrzdi, otoč sa a vydrž v doku jednu sekundu.", "Preleť, len keď je brána otvorená.", "Vyhýbaj sa spojencom. Každý zásah spojenca stojí život."],
  hu: ["Minden szakasz növeli a szintet és a nehézséget.", "Gyorsíts az utoljára választott irányba.", "Fékezz, fordulj és tartsd a helyzeted a dokkban egy másodpercig.", "Csak nyitott kapun repülj át.", "Kíméld a szövetségeseket. Minden szövetséges találat egy életbe kerül."],
  ro: ["Fiecare sector mărește nivelul și dificultatea.", "Folosește propulsia pentru a accelera în ultima direcție aleasă.", "Frânează, rotește nava și menține poziția în doc timp de o secundă.", "Treci numai când poarta este deschisă.", "Evită aliații. Fiecare aliat lovit te costă o viață."],
  sr: ["Свака деоница повећава ниво и тежину.", "Користи потисак да убрзаш у последњем смеру кретања.", "Закочи, окрени се и задржи положај у доку једну секунду.", "Пролети само када је пролаз отворен.", "Поштеди савезнике. Сваки погодак савезника кошта један живот."],
  uk: ["З кожною ділянкою зростають рівень і складність.", "Прискорюйся в останньому вибраному напрямку.", "Загальмуй, розвернись і утримуй позицію у відсіку одну секунду.", "Пролітай, лише коли прохід відкритий.", "Бережи союзників. Кожне влучання в союзника коштує життя."],
  th: ["ทุกช่วงใหม่จะเพิ่มระดับและความยาก", "กดเร่งเพื่อพุ่งไปในทิศที่บังคับล่าสุด", "เบรก หมุนยาน แล้วค้างในช่องเทียบยานหนึ่งวินาที", "บินผ่านเมื่อช่องเปิดเท่านั้น", "หลีกเลี่ยงฝ่ายเดียวกัน ยิงโดนหนึ่งครั้งเสียหนึ่งชีวิต"],
  zh: ["每进入一个新航段，关卡和难度都会提升。", "按加速键向最近一次操纵的方向冲刺。", "制动并调整朝向，在对接舱内保持一秒。", "只在通道开放时穿过。", "避开友军目标。每次误击都会损失一条生命。"],
  vi: ["Mỗi chặng mới tăng cấp độ và độ khó.", "Dùng tăng tốc để lao theo hướng vừa điều khiển.", "Phanh, xoay và giữ yên trong khoang ghép nối một giây.", "Chỉ bay qua khi cổng mở.", "Tránh bắn đồng minh. Mỗi phát trúng đồng minh mất một mạng."],
};

const escapeMarkup = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const js = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

function runStatus(game: number) {
  switch (game) {
    case 0: return "s.v === 2 ? vocab.chains+' '+s.chain+'/4' : vocab.shards+' '+s.collected+(s.v === 5 ? '/24' : '')";
    case 1: return "s.v === 3 ? vocab.vortex+' '+s.swirlPassages+'/3' : s.v === 4 ? w.boost+' '+s.boost : arcCopy.name";
    case 3: return "vocab.ring+' '+s.passed+'/12 · '+vocab.goal+' 8'+(s.v === 3 ? ' · '+w.brake+' '+s.brake.toFixed(1)+' s' : s.v === 5 ? ' · '+vocab.streak+' '+s.combo : '')";
    case 4: return "vocab.hit+' '+s.hitsOnTarget+'/'+s.goal+(s.v === 4 ? ' · '+vocab.ammo+' '+s.ammo : s.v === 3 ? ' · '+vocab.allyHit+' '+s.friendlyHits : '')";
    case 5: return "vocab.intercept+' '+s.intercepted+'/'+s.goal+(s.v === 5 ? ' · '+vocab.ammo+' '+s.ammo : s.v === 4 ? ' · '+w.decoy+' '+s.decoys : '')";
    case 6: return "vocab.rescue+' '+s.rescued+'/'+s.goal+' · '+vocab.cargo+' '+s.cargo.length+'/'+s.capacity";
    case 7: return "vocab.kill+' '+s.kills+'/'+s.goal+' · '+vocab.ammo+' '+s.reserve+(s.v === 3 ? ' · '+w.shield+' '+s.shield.toFixed(1)+' s' : '')";
    default: return "arcCopy.name";
  }
}

export function withArcadePublicLocale(page: string, locale: ArcadeLocale, index: number, germanName: string) {
  const words = arcadeWords(locale);
  const terms = arcadeTerms(locale);
  const copy = arcadeStationCopy(locale, index, germanName);
  const game = Math.floor(index / 5);
  const variant = index % 5 + 1;
  const level = (index + 1) * 5;
  const [progression, boost, docking, phase, friendly] = hints[locale];
  const arrows = game === 0 || game === 3;
  const aiming = game === 4 || game === 5;
  const shooting = aiming || game === 7;
  const activeControls = [
    arrows ? words.arrows : aiming ? words.aim : words.move,
    arrows ? "A / D · ← / →" : "W / A / S / D · ↑ / ← / ↓ / →",
    shooting ? words.fire + " · ␣" : "",
    game === 1 && variant === 4 ? words.boost + " · ␣" : "",
    game === 2 ? words.rotate + " ↶ / ↷ · Q / E · " + words.brake + " · ␣" : "",
    game === 3 && variant === 3 ? words.brake + " · ␣" : "",
    game === 7 && variant === 3 ? words.shield + " · ⇧" : "",
  ].filter(Boolean).join(" ");
  const detail = locale === "de" ? "" : game === 1 && variant === 4 ? boost
    : game === 2 ? docking : game === 3 && variant === 3 ? phase : game === 4 && variant === 3 ? friendly : "";
  const mapLink = "‹ " + words.map;
  const sound = terms.sound;
  const medalNames = [words.bronze, words.silver, words.gold];
  const mapTarget = "#galaxy-arcade-navigation a";
  const isDock = game === 2;
  const goalText = [copy.description, detail, progression, words.keepFlying].filter(Boolean).join(" ");

  const staticCopy: [string, string][] = [
    ['<html lang="de">', '<html lang="' + locale + '">'],
    ["‹ Galaxiekarte</a>", escapeMarkup(mapLink) + "</a>"],
    ["Minispiel wird geladen …", escapeMarkup(words.loading)],
    ["Das Minispiel ist gerade nicht verfügbar. Versuche es erneut über die Galaxiekarte.", escapeMarkup(words.unavailable)],
    ["Das Minispiel konnte nicht gestartet werden. Kehre zur Galaxiekarte zurück und versuche es erneut.", escapeMarkup(words.unavailable)],
    ['<title>Cryptoid Evolution · Retro Arcade</title>', '<title>' + escapeMarkup(copy.name) + ' · Cryptoid Evolution</title>'],
    ['aria-label="Missionsvorschau"', 'aria-label="' + escapeMarkup(copy.name) + '"'],
    ['aria-label="Rundenstatus"', 'aria-label="' + escapeMarkup(words.report) + '"'],
    ['aria-label="Spielfeld"', 'aria-label="' + escapeMarkup(copy.name) + '"'],
    ['aria-label="Aktive Mission. Zum Fliegen oder Zielen die Touch-Steuerung verwenden; Maus und Tastatur werden ebenfalls unterstützt."', 'aria-label="' + escapeMarkup(copy.name) + '"'],
    ['aria-label="Seitlich fliegen"', 'aria-label="' + escapeMarkup(words.controls) + '"'],
    ['aria-label="Nach links fliegen"', 'aria-label="' + escapeMarkup(words.left) + '"'],
    ['aria-label="Nach rechts fliegen"', 'aria-label="' + escapeMarkup(words.right) + '"'],
    ['aria-label="Schiff drehen"', 'aria-label="' + escapeMarkup(words.rotate) + '"'],
    ['aria-label="Links drehen" aria-pressed="false">↶ Links', 'aria-label="' + escapeMarkup(words.left) + '" aria-pressed="false">↶ ' + escapeMarkup(words.left)],
    ['aria-label="Rechts drehen" aria-pressed="false">↷ Rechts', 'aria-label="' + escapeMarkup(words.right) + '" aria-pressed="false">↷ ' + escapeMarkup(words.right)],
    ["hidden>Schild halten</button>", "hidden>" + escapeMarkup(words.shield) + "</button>"],
    ['id="pause" class="compact">Pause', 'id="pause" class="compact">' + escapeMarkup(words.pause)],
    ["<small>PUNKTE</small>", "<small>" + escapeMarkup(words.score) + "</small>"],
    ["<small>RESTZEIT</small>", "<small>" + escapeMarkup(words.remaining) + "</small>"],
    ["<small>ANDOCKBUCHT</small>", "<small>" + escapeMarkup(words.bay) + "</small>"],
    ['id="healthLabel">SCHUTZLADUNGEN', 'id="healthLabel">' + escapeMarkup(words.lives)],
    ['aria-label="Andockhilfe"', 'aria-label="' + escapeMarkup(words.bay) + '"'],
    ['<span>Position<b id="dockPosition">', '<span>' + escapeMarkup(words.position) + '<b id="dockPosition">'],
    ['<span>Tempo<b id="dockSpeed">', '<span>' + escapeMarkup(words.speed) + '<b id="dockSpeed">'],
    ['<span>Winkel<b id="dockAngle">', '<span>' + escapeMarkup(words.angle) + '<b id="dockAngle">'],
    ['<span>Halten<b id="dockHold">', '<span>' + escapeMarkup(words.hold) + '<b id="dockHold">'],
  ];
  for (const [before, after] of staticCopy) page = page.replace(before, () => after);
  // The same game code and score calculations are used by every language.
  const canvasWords: Record<string, string> = {
    "OFFEN": words.open, "GESCHLOSSEN": words.closed, "ÖFFNUNG": words.opening,
    "JETZT NACH AUSSEN": terms.out, "INSEL ERREICHEN": words.approach,
    "DURCH DIE ÖFFNUNG RAUS": words.opening + " · " + terms.out,
    "ZUR INSEL FLIEGEN": words.approach, "DURCH DIE ÖFFNUNG REIN": words.opening + " · " + words.approach,
    "AUSSEN NEU ANFLIEGEN": terms.out + " · " + words.approach,
    "SICHERER KORRIDOR": terms.safePass, "SEKTOR WIRD ENGER": terms.narrow,
    "IM RAHMEN BLEIBEN": terms.hold,
    "SICHER ANGEDOCKT": words.docked, "LEVEL GESCHAFFT": words.clear, "LEVELZIEL VERFEHLT": words.failed,
    "ABDOCKEN · NÄCHSTE BUCHT": words.depart + " · " + words.bay,
    "BUCHTMITTE ANFLIEGEN": words.approach, "RELATIVTEMPO ANGLEICHEN": words.match,
    "LINKS DREHEN": "↶ " + words.left, "RECHTS DREHEN": "↷ " + words.right,
    "POSITION HALTEN · FREIGABE LÄUFT": terms.hold, "IM ANFLUG": words.approach,
    "FREUND": words.friend, "ZIEL": words.target, "LEER": words.decoy, "LEERER KÖRPER": words.decoy,
    "KERN TREFFEN": words.target + " · " + terms.core, "PANZERUNG": words.closed,
    "STATION": words.bay, "RETTUNGSBASIS": terms.base, "KAPSEL": terms.rescue,
    "SAUERSTOFF LEER": words.oxygen + " 0", "KAPSEL AN BORD": terms.cargo,
    "FRACHTER": terms.freighter, "RUMPF BESCHÄDIGT": terms.freighter + " !",
    "HINTERHALT RECHTS": words.warning + " →", "HINTERHALT LINKS": "← " + words.warning,
    "ZANGENANGRIFF": "← " + words.warning + " →", "SCHUSS LÄDT": words.warning,
    "SEKTORWECHSEL NAHT": words.level + " →", "VOM RAND WEG LENKEN": words.move,
    "PRÄZISION": terms.center, "RINGPASSAGE": terms.ring, "WIRBELPASSAGE": terms.vortex,
    "VIERERKETTE": terms.chains, "SCHUB-AUSWEICHEN": terms.boostDodge, "GEGNER": terms.kill,
    "VERBÜNDETER": words.friend, "ZUSATZSCHÜSSE": terms.ammo, "GERETTET": terms.rescue,
    "HINWEG": "→", "RÜCKWEG": "←", "ANDOCKBUCHT": words.bay,
    "MAGNET AKTIV": terms.magnet + " · " + words.on, "MAGNET LÄDT": terms.magnet + " · " + words.off,
  };
  const script = `
    const w = ${js(words)};
    const arcCopy = ${js(copy)};
    const vocab = ${js(terms)};
    const scoreFormat = new Intl.NumberFormat(${js(locale)});
    const returnLink = document.querySelector(${js(mapTarget)});
    const runId = arcadeLaunchOptions.get('arcade-run');
    let bestMedal = 0;
    function sendResult(score, best, tier) {
      if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(runId || '') || !Number.isSafeInteger(score) || !Number.isSafeInteger(best)) return;
      bestMedal = Math.max(bestMedal, tier);
      returnLink.hash = new URLSearchParams({ 'arcade-run': runId, station: ${level}, score, best, medal: bestMedal }).toString();
    }
    `;
  const canvasScript = locale === "de" ? "" : `
    const label = C.graphics.label;
    const localizedLabels = ${js(canvasWords)};
    C.graphics.label = function(ctx, text, ...rest) {
      if (typeof text === 'string') {
        if (Object.hasOwn(localizedLabels, text)) text = localizedLabels[text];
        else {
          const prefix = /^([^+−\\d]+?)\\s+([+−]?\\d.*)$/.exec(text);
          if (prefix && Object.hasOwn(localizedLabels, prefix[1])) text = localizedLabels[prefix[1]] + ' ' + prefix[2];
          else text = text.replace(/\\b(ZUSATZSCHÜSSE|GERETTET)\\b/g, word => localizedLabels[word]);
        }
      }
      return label.call(this, ctx, text, ...rest);
    };
    function localizedStatus(s) { return ${runStatus(game)}; }
    const drawRibbon = C.operations.ribbon;
    C.operations.ribbon = (ctx, title, status) => drawRibbon(ctx, arcCopy.name, C.session ? localizedStatus(C.session.state) : status);
    `;
  page = page
    .replace("function soundLabel()", () => script + "function soundLabel()")
    .replace("C.soundOn?'Ton an':'Ton aus'", "vocab.sound+' '+(C.soundOn?w.on:w.off)")
    .replace("C.soundOn?'Ton ausschalten':'Ton einschalten'", "vocab.sound")
    .replace("function intro(v){", () => canvasScript + "function intro(v){")
    .replace("selectedVariant=selected.variants[v-1];", "selectedVariant={...selected.variants[v-1],name:arcCopy.name,scoring:arcCopy.scoring};")
    .replace(/<p class="briefing-meta">[^<]*<\/p><canvas/, () => '<p class="briefing-meta">' + escapeMarkup(words.survival + " · 3 " + words.lives) + '</p><canvas')
    .replace(/<p class="briefing-goal">[\s\S]*?(?=\$\{renderMedalGoals\(\)\})/, () =>
      '<p class="briefing-goal">' + escapeMarkup(goalText) + '</p><div class="briefing-controls"><b>' +
      escapeMarkup(words.controls) + '</b><small>' + (locale === "de" ? "\${m.controls}" : escapeMarkup(activeControls)) +
      '</small></div><details class="briefing-extra"><summary>' + escapeMarkup(words.scoring) +
      '</summary><small>' + escapeMarkup(copy.scoring) + '</small></details>')
    .replace("MISSIONSBRIEFING ·", () => escapeMarkup(words.briefing) + " ·")
    .replace('id="startRound">Mission starten →', () => 'id="startRound">' + escapeMarkup(words.play) + " →")
    .replace(/(id="(?:cancelIntro|pauseBack|loadBack|resultBack)">)Zur Galaxiekarte/g, (_, before) => before + escapeMarkup(words.map))
    .replace(/<small class="quiet-note">Lokale Testmission[^<]*<\/small>/, '<small class="quiet-note">Testnet</small>')
    .replace("Originalgrafiken noch nicht verfügbar", () => escapeMarkup(words.unavailable))
    .replace("$('loadError').textContent=e.message;", "$('loadError').textContent='';")
    .replace('id="retry">Erneut laden', () => 'id="retry">' + escapeMarkup(words.retry))
    .replace("FLUG UNTERBROCHEN", () => escapeMarkup(words.pause))
    .replace("Kurze Pause", () => escapeMarkup(words.pause))
    .replace("$('pauseReason').textContent=reason;", "$('pauseReason').hidden=true;")
    .replace('id="resume">Weiterfliegen →', () => 'id="resume">' + escapeMarkup(words.resume) + " →")
    .replace('id="restart">Neu starten', () => 'id="restart">' + escapeMarkup(words.retry))
    .replace("MISSIONSBERICHT ·", () => escapeMarkup(words.report) + " ·")
    .replace("\${s.success?'Mission geschafft':'Versuch beendet'}", () => escapeMarkup(words.runFinished))
    .replace("score.toLocaleString('de-DE')", "scoreFormat.format(score)")
    .replace("<small>Punkte</small>", () => "<small>" + escapeMarkup(words.score) + "</small>")
    .replace("$('resultMessage').textContent=s.message;", "sendResult(score,best,medalTier(medalValue(s)));$('resultMessage').hidden=true;")
    .replace(/<small class="best-note">[\s\S]*?(?=<details class="briefing-extra">)/, "")
    .replace(/<summary>(?:Letzter Abschnitt und Wertung|Flugprotokoll und Wertung)<\/summary>/,
      () => '<summary>' + escapeMarkup(words.scoring) + '</summary>')
    .replace("$('resultDetails').textContent=C.session.module.result(s);", "$('resultDetails').hidden=true;")
    .replace('id="again">Noch einmal fliegen →', () => 'id="again">' + escapeMarkup(words.playAgain) + " →")
    .replace("Testpunkte bleiben lokal · keine Account-Gutschrift", () => escapeMarkup(words.returnNote))
    .replace("'Level ' + state.section", "w.level + ' ' + state.section")
    .replace("'Erreichtes Level'", "w.reached")
    .replace("'Andockmanöver' : 'Level geschafft'", "vocab.dock : w.cleared")
    .replace("'Flugzeit'", "w.flightTime")
    .replace("'Wirbelpassagen'", "vocab.vortex")
    .replace("$('healthLabel').textContent='LEBEN';", "$('healthLabel').textContent=w.lives;")
    .replace(/const medal = [^\n]+;/, line => line.replace(/"label":"(?:\\.|[^"\\])*"/, () => '"label":' + js(copy.medalLabel)))
    .replace("const medalNames = ['Bronze', 'Silber', 'Gold'];", () => "const medalNames = " + js(medalNames) + ";")
    .replace(/ \+ ' ERREICHT'/, " + ' ✓'")
    .replace(/ \+ ' erreicht'/, " + ' ✓'")
    .replace("Medaillenziel offen", () => escapeMarkup(words.medalGoals))
    .replace("Medaillenziele · Testmodus", () => escapeMarkup(words.medalGoals))
    .replace('aria-label="Testmedaille"', () => 'aria-label="' + escapeMarkup(words.medalGoals) + '"')
    .replace("actionButton.textContent = action || '';", () => "actionButton.textContent = action ? " +
      js(shooting ? words.fire : game === 1 ? words.boost : words.brake) + " : '';")
    .replace("module.aiming ? 'Joystick zum Zielen' : 'Joystick zum Fliegen'", () => js(aiming ? words.aim : words.move))
    .replace(/\$\('gameEquipment'\)\.textContent=\x60[^\x60]+\x60;/, "$('gameEquipment').textContent=ship.name||ship.modelId;");
  if (isDock) {
    for (const [before, after] of Object.entries({
      "Passt": words.ready, "Zur Bucht": words.approach, "Angleichen": words.match,
      "Bremsen": words.brake, "↶ Links": "↶ " + words.left, "↷ Rechts": "↷ " + words.right, "Abflug": words.depart,
    })) page = page.split("'" + before + "'").join(js(after));
    page = page.replace(/const text = s\.impulses \? [^\n]+;/, () =>
      "const text = " + js(terms.impulses) + " + ' ' + s.impulses;");
  } else if (locale !== "de") {
    page = page.replace("$('missionLine').textContent=C.session.module.status(s);", "$('missionLine').textContent=localizedStatus(s);");
  }
  return page;
}
