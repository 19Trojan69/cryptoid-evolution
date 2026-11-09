const controlsStyle = `<style>
  [data-joystick] .control-deck {
    --control-height: 92px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  [data-joystick] .control-surface, [data-joystick] .touchpad { height: var(--control-height); }
  [data-joystick] .touchpad { background: radial-gradient(ellipse at 50% 42%, #263c5d, #131a32 76%); }
  [data-joystick] .pad-heading { top: auto; bottom: 4px; line-height: 12px; text-transform: uppercase; }
  [data-joystick] .pad-hint { display: none; }
  [data-joystick] .pad-ring, [data-joystick] .pad-dot { left: 50%; top: calc(50% - 8px); }
  [data-joystick] .pad-ring {
    width: 68px;
    height: 68px;
    border-color: #6b91a8;
    background: #0d192e;
    box-shadow: inset 0 0 0 4px #77c4d326;
  }
  [data-joystick] .pad-dot {
    width: 24px;
    height: 24px;
    border: 2px solid #a6e9ed;
    border-radius: 50%;
    background: #407587;
  }
  [data-joystick] .control-actions { width: auto; }
  [data-joystick] .control-actions .action {
    flex: 1;
    border-color: #e4a373;
    color: #ffe2b4;
    background: linear-gradient(155deg, #843b32, #51243a);
    box-shadow: inset 0 -4px #31192a;
    font-size: clamp(16px, 4vw, 22px);
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  [data-joystick] .control-actions .action[aria-pressed="true"] {
    color: #301a1d;
    background: var(--gold);
    box-shadow: inset 0 3px #b88049;
  }
  @media (max-height: 460px) and (min-width: 520px) and (orientation: landscape) {
    #gameScreen[data-joystick] {
      --side-control-width: clamp(90px, 19vw, 160px);
      grid-template-rows: 44px minmax(80px, 1fr) auto;
    }
    #gameScreen[data-joystick] .stage {
      grid-column: 1 / -1;
      margin-inline: calc(var(--side-control-width) + 8px);
    }
    #gameScreen[data-joystick] .mission-line {
      grid-column: 1 / -1;
      grid-row: 3;
      height: auto;
      min-height: 0;
      max-height: 32px;
    }
    #gameScreen[data-joystick] #controls { grid-column: 1 / -1; pointer-events: none; }
    [data-joystick] .control-deck {
      grid-template-columns: repeat(2, var(--side-control-width));
      justify-content: space-between;
    }
    [data-joystick] .touchpad, [data-joystick] .control-actions .action { pointer-events: auto; }
  }
</style>`;

export function withArcadeTouchControls(html: string) {
  // The arcade is a sealed standalone document. Reuse its analog pad and
  // independent action pointer so aiming and shooting can overlap.
  return html
    .replace("</head>", `${controlsStyle}</head>`)
    .replace("configure(module){clear();horizontal=", `configure(module){
      clear();
      const joystick = !!module.aiming;
      document.getElementById('gameScreen').toggleAttribute('data-joystick', joystick);
      switcher.hidden = joystick;
      arrows = !joystick && C.storage.get('controls-mode', 0) === 1;
      pad.querySelector('.pad-heading').textContent = joystick ? 'Joystick' : 'STEUERFLÄCHE';
      pad.setAttribute('aria-label', joystick ? 'Joystick zum Zielen. In die gewünschte Richtung ziehen und halten.' : 'Steuerfläche unter dem Spielfeld: kurz in die gewünschte Richtung ziehen und halten. Richtungstasten sind als Alternative verfügbar.');
      horizontal=`)
    .replace("action:()=> 'Abfangen'", "action:()=> 'Feuer'")
    .replace("Fadenkreuz mit der Steuerfläche unter dem Spielfeld bewegen.", "Fadenkreuz mit dem Joystick bewegen.")
    .replace("Fadenkreuz mit der Steuerfläche bewegen und Abfangen separat auslösen.", "Fadenkreuz mit dem Joystick bewegen und Feuer antippen oder halten.");
}
