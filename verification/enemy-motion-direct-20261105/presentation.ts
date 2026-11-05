// These are the existing three CSS consumer formulas, without inherited live
// custom-property data. Only the normal enemy caller supplies these values.
export function enemyMotionStyles(bank: number, flame: string, light: number) {
  return {
    visual: { transform: `rotate(180deg) perspective(420px) rotateY(${bank}deg)` },
    engine: { height: `calc(${flame} + 2px)` },
    reflection: { opacity: light },
  };
}
