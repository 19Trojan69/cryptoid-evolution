const controlsMarkup = `<div id="controls">
  <div class="control-deck">
    <div class="control-surface">
      <div id="touchpad" class="touchpad" role="group" hidden>
        <span class="pad-heading">Joystick</span>
        <span class="pad-ring" aria-hidden="true"></span>
        <span class="pad-dot" aria-hidden="true"></span>
      </div>
      <div id="steering" class="steering" role="group" aria-label="Seitlich fliegen" hidden>
        <button type="button" data-control="left" aria-label="Nach links fliegen" aria-pressed="false">
          <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M4 8h2V6h2V4h2v4h6v4h-6v4H8v-2H6v-2H4z"/></svg>
        </button>
        <button type="button" data-control="right" aria-label="Nach rechts fliegen" aria-pressed="false">
          <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" transform="translate(20 0) scale(-1 1)" d="M4 8h2V6h2V4h2v4h6v4h-6v4H8v-2H6v-2H4z"/></svg>
        </button>
      </div>
    </div>
    <div class="control-actions" hidden>
      <button type="button" id="action" class="action" data-control="action" aria-pressed="false" hidden></button>
      <button type="button" id="shield" class="action" data-control="shield" aria-pressed="false" hidden>Schild halten</button>
      <div id="dockExtra" class="dock-extra" role="group" aria-label="Schiff drehen" hidden>
        <button type="button" data-control="turnLeft" aria-label="Links drehen" aria-pressed="false">↶ Links</button>
        <button type="button" data-control="turnRight" aria-label="Rechts drehen" aria-pressed="false">↷ Rechts</button>
      </div>
    </div>
  </div>
</div>`;

const controlsStyle = `<style>
  #gameScreen[data-movement] {
    --control-height: 92px;
    --movement-column: 2;
    --action-column: 1;
  }
  #gameScreen[data-control-hand="left"] {
    --movement-column: 1;
    --action-column: 2;
  }
  [data-movement] .control-deck { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  [data-movement] .control-surface { grid-column: var(--movement-column); grid-row: 1; height: var(--control-height); }
  [data-movement="arrows"]:not([data-actions]) .control-surface { grid-column: 1 / -1; }
  [data-movement] #steering {
    height: var(--control-height);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: 1fr;
    gap: 6px;
  }
  [data-movement] #steering button { display: grid; place-items: center; }
  [data-movement] .touchpad {
    height: var(--control-height);
    background: radial-gradient(ellipse at 50% 42%, #263c5d, #131a32 76%);
  }
  [data-movement] .pad-heading { top: auto; bottom: 4px; line-height: 12px; text-transform: uppercase; }
  [data-movement] .pad-ring, [data-movement] .pad-dot { left: 50%; top: calc(50% - 8px); }
  [data-movement] .pad-ring {
    width: 68px;
    height: 68px;
    border-color: #6b91a8;
    background: #0d192e;
    box-shadow: inset 0 0 0 4px #77c4d326;
  }
  [data-movement] .pad-dot {
    width: 24px;
    height: 24px;
    border: 2px solid #a6e9ed;
    border-radius: 50%;
    background: #407587;
  }
  [data-movement] .control-actions {
    grid-column: var(--action-column);
    grid-row: 1;
    width: auto;
    height: var(--control-height);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: minmax(44px, 1fr);
    gap: 4px;
  }
  [data-movement] .control-actions button { min-width: 0; }
  [data-movement] #controls button { touch-action: none; -webkit-touch-callout: none; }
  [data-rotation] .control-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  [data-rotation] .dock-extra {
    display: grid;
    grid-template-rows: repeat(2, minmax(44px, 1fr));
    gap: 0;
    border: 1px solid #6b91a8;
  }
  [data-rotation] .dock-extra button { padding: 3px; border: 0; }
  [data-rotation] .dock-extra button + button { border-top: 1px solid #6b91a8; }
  [data-rotation] .dock-extra button[aria-pressed="true"] { color: #0c2230; background: var(--cyan); }
  [data-movement] .control-actions .fire {
    border-color: #e4a373;
    color: #ffe2b4;
    background: linear-gradient(155deg, #843b32, #51243a);
    box-shadow: inset 0 -4px #31192a;
    font-size: clamp(16px, 4vw, 22px);
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  [data-movement] .control-actions .fire[aria-pressed="true"] {
    color: #301a1d;
    background: var(--gold);
    box-shadow: inset 0 3px #b88049;
  }
  @media (max-height: 460px) and (min-width: 520px) and (orientation: landscape) {
    #gameScreen[data-movement] {
      --side-control-width: clamp(95px, 19vw, 160px);
      grid-template-rows: 44px minmax(80px, 1fr) auto;
    }
    #gameScreen[data-rotation] { --side-control-width: clamp(132px, 20vw, 160px); }
    #gameScreen[data-movement] .stage {
      grid-column: 1 / -1;
      margin-inline: calc(var(--side-control-width) + 8px);
    }
    #gameScreen[data-movement] .mission-line {
      grid-column: 1 / -1;
      grid-row: 3;
      height: auto;
      min-height: 0;
      max-height: 32px;
    }
    #gameScreen[data-movement] #controls { grid-column: 1 / -1; pointer-events: none; }
    [data-movement] .control-deck,
    [data-movement="arrows"]:not([data-actions]) #steering {
      grid-template-columns: repeat(2, var(--side-control-width));
      justify-content: space-between;
    }
    [data-movement] .touchpad, [data-movement] #controls button { pointer-events: auto; }
  }
</style>`;

const configureControls = `configure(module, variant) {
      clear();
      horizontal = !!module.horizontal;
      pad.hidden = horizontal;
      steering.hidden = !horizontal;
      pad.setAttribute('aria-label', module.aiming ? 'Joystick zum Zielen' : 'Joystick zum Fliegen');

      const action = module.action?.(variant);
      const rotation = !!module.rotation;
      const shield = module.shieldVariant === variant;
      const actionButton = document.getElementById('action');
      actionButton.hidden = !action;
      actionButton.textContent = action || '';
      actionButton.classList.toggle('fire', action === 'Feuer');
      document.getElementById('shield').hidden = !shield;
      document.getElementById('dockExtra').hidden = !rotation;
      const hasActions = !!(action || rotation || shield);
      controls.querySelector('.control-actions').hidden = !hasActions;

      const gameScreen = document.getElementById('gameScreen');
      const hand = new URLSearchParams(window.location.hash.slice(1)).get('hand');
      gameScreen.dataset.controlHand = hand === 'left' ? 'left' : 'right';
      gameScreen.dataset.movement = horizontal ? 'arrows' : 'joystick';
      gameScreen.toggleAttribute('data-actions', hasActions);
      gameScreen.toggleAttribute('data-rotation', rotation);
    }`;

const briefingUpdates = [
  ["Ziehe und halte auf der Steuerfläche unter dem Spiel. Du kannst auf Richtungstasten wechseln. Je nach Mission erscheint daneben ein eigener Aktionsbutton.", "Halte bei seitlichen Flügen die Pfeile. Ziehe den Joystick bei freier Bewegung und zum Zielen. Je nach Mission gibt es eigene Tasten für Feuer, Drehung oder andere Aktionen."],
  ["Mit den Fingern die Steuerfläche unter dem Spielfeld verwenden;", "Zum Fliegen oder Zielen die Touch-Steuerung verwenden;"],
  ["Steuerfläche: seitlich ziehen und halten. Alternativ Haltepfeile, A/D oder Pfeiltasten. Finger bleiben unter dem Spielfeld.", "Halte den linken oder rechten Pfeil. Auf der Tastatur kannst du A/D oder die Pfeiltasten verwenden."],
  ["Steuerfläche: in eine Richtung ziehen und halten. Alternativ Haltepfeile oder WASD/Pfeile. V04: Schub/Leertaste separat auslösen.", "Ziehe den Joystick in die gewünschte Flugrichtung. Alternativ kannst du WASD oder die Pfeiltasten nutzen. In Impulsantrieb löst du den Schub mit der Schubtaste oder der Leertaste aus."],
  ["Steuerfläche, Pfeile/WASD oder Haltebuttons geben Schub in Bildschirmrichtung.", "Ziehe den Joystick in die Flugrichtung oder verwende Pfeiltasten/WASD."],
  ["Bremse separat halten (Leertaste); mit ↶/↷ oder Q/E ausrichten.", "Halte oben für Linksdrehung oder unten für Rechtsdrehung. Bremse separat mit der Bremstaste. Auf der Tastatur drehst du mit Q/E und bremst mit der Leertaste."],
  ["Steuerfläche: seitlich ziehen und halten, alternativ Haltepfeile oder A/D/Pfeile.", "Halte den linken oder rechten Pfeil. Alternativ kannst du A/D oder die Pfeiltasten nutzen."],
  ["Fadenkreuz mit der Steuerfläche unter dem Spielfeld bewegen.", "Fadenkreuz mit dem Joystick bewegen."],
  ["Fadenkreuz mit der Steuerfläche bewegen und Abfangen separat auslösen.", "Fadenkreuz mit dem Joystick bewegen und Feuer antippen oder halten."],
  ["Steuerfläche: in die Richtung ziehen und halten, alternativ Haltepfeile/WASD.", "Ziehe den Joystick in die gewünschte Flugrichtung. Alternativ kannst du Pfeiltasten/WASD nutzen."],
  ["Steuerfläche oder Haltepfeile/WASD bewegen dein Schiff; Grundfeuer läuft automatisch. Feste gegnerische Schusslinien meiden. Jeder zweite Abschuss lässt fünf stärkere Zusatzschüsse fallen. In Schildbegleitung Schild/Leertaste separat halten.", "Steuere mit dem Joystick oder mit Pfeiltasten/WASD. Tippe auf Feuer oder halte die Taste gedrückt. Auf der Tastatur feuerst du mit der Leertaste. Weiche gegnerischen Schusslinien aus. Jeder zweite Abschuss lässt fünf stärkere Zusatzschüsse fallen. In Schildbegleitung hältst du Schild oder die Umschalttaste separat."],
  ["Automatisch feuern, Gegnerschüssen ausweichen und Frachter schützen.", "Gegner abschießen, Schusslinien ausweichen und Frachter schützen."],
  ["Automatisches Grundfeuer · Kugeln geben je 5 Shots", "Feuer drücken · Kugeln geben je 5 Zusatzschüsse"],
] as const;

export function withArcadeTouchControls(html: string) {
  // Adapt the sealed document at the existing input hooks. The same pointer
  // capture, analog movement, keyboard handling and shot cooldowns drive play.
  let document = html
    .replace("</head>", `${controlsStyle}</head>`)
    .replace(/<div id="controls">[\s\S]*?(?=\s*<small class="game-note")/, controlsMarkup)
    .replace(",switcher=document.getElementById('controlSwitch')", "")
    .replace(",switchPointer=null,horizontal=false,arrows=C.storage.get('controls-mode',0)===1", ",horizontal=false")
    .replace("switchPointer=null;resetPad()", "resetPad()")
    .replace(/\n function mode\(\)\{[\s\S]*?(?=\n pad\.addEventListener\('pointerdown',)/, "")
    .replace("||arrows||padPointer", "||horizontal||padPointer")
    .replace(/const b=pad\.getBoundingClientRect\(\);.*?(?=pad\.classList\.add\('active'\);)/, "")
    .replace("const keys=new Set(),held=new Map(),pad=", "const keys=new Set(),held=new Map(),pending=new Set(),pad=")
    .replace(/padImpulse=false/g, "padImpulse=null")
    .replace("padSector=null;padImpulse=null;pad.classList", "padSector=null;pad.classList")
    .replace("const clear=()=>{keys.clear();held.clear();", "const clear=()=>{keys.clear();held.clear();pending.clear();padImpulse=null;")
    .replace("if(sector!==null&&sector!==padSector)padImpulse=true;", "if(sector!==null&&sector!==padSector)padImpulse={x:padX,y:padY};")
    .replace("if(e.pointerId===padPointer)resetPad();", "if(e.pointerId===padPointer){if(type!=='pointerup')padImpulse=null;resetPad();}")
    .replace(
      "for(const b of controls.querySelectorAll('[data-control]')){",
      `function notePress(dir) {
        if(dir==='action') actionEdge=true;
        else {
          pending.add(dir);
          if(['left','right','up','down'].includes(dir)) impulse=true;
        }
      }
      for(const b of controls.querySelectorAll('[data-control]')){`,
    )
    .replace("if(dir==='action')actionEdge=true;else impulse=true;", "notePress(dir);")
    .replace("if(!keys.has(map[key])){if(map[key]==='action')actionEdge=true;else impulse=true;}", "if(!keys.has(map[key]))notePress(map[key]);")
    .replace("const down=d=>keys.has(d)||", "const down=d=>keys.has(d)||pending.has(d)||")
    .replace(
      "const result={x:digitalX||digitalY?digitalX:padX,y:digitalX||digitalY?digitalY:padY,",
      `const analog=(padX||padY) ? {x:padX,y:padY} : padImpulse;
        const result={x:digitalX||digitalY?digitalX:analog?.x||0,y:digitalX||digitalY?digitalY:analog?.y||0,`,
    )
    .replace("action:down('action'),actionEdge", "action:down('action')||actionEdge,actionEdge")
    .replace("impulse:impulse||padImpulse", "impulse:impulse||!!padImpulse")
    .replace("actionEdge=false;impulse=false;padImpulse=null;fireEdge=false;return result", "pending.clear();actionEdge=false;impulse=false;padImpulse=null;fireEdge=false;return result")
    .replace(/configure\(module\)\{[^}]+\}/, configureControls)
    .replace("input.configure(m);screen('gameScreen');resize();const action=m.action?.(v);", "input.configure(m,v);screen('gameScreen');resize();")
    .replace(/\$\('action'\)\.hidden=!action;.*?(?=\$\('pause'\)\.disabled=true;)/, "")
    .replace("action:()=> 'Abfangen'", "action:()=> 'Feuer'")
    .replace("C.modules.G08={async ready()", "C.modules.G08={shieldVariant:3,async ready()")
    .replace("action:v=>v===3?'Schild halten':null", "action:()=> 'Feuer'")
    .replace("e:'turnRight'}", "e:'turnRight',Shift:'shield'}")
    .replace("action:down('action')||actionEdge,actionEdge", "action:down('action')||actionEdge,shield:down('shield'),actionEdge")
    .replace("!!input.action&&s.shield>0", "input.shield&&s.shield>0")
    .replace("s.fireClock<=0&&s.shots.length<16", "(input.fireEdge||input.actionEdge||input.action||input.pointHeld)&&s.fireClock<=0&&s.shots.length<16");

  for (const [before, after] of briefingUpdates) document = document.replace(before, after);
  return document;
}
