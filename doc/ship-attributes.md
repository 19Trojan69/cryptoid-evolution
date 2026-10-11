# Individual player hull attributes

Shard-bought hulls now provide real combat progression. The free Grey Scout
keeps its existing behavior. Every other hull gains stronger shots and a
higher firing rate, with distinct combinations of the two attributes.

The profile is keyed by the existing hull ID. Existing owners receive the
benefits without another purchase or save migration. Paint, duplicate copies,
prices, release locks and Advanced/Elite prerequisites do not change.

## Combat and presentation

- Shot damage is multiplied once when a new projectile is created. Purchased
  weapons, collected weapons, Overdrive and Elite damage keep their existing
  behavior and also receive the hull multiplier.
- Firing interval is divided by the hull's fire-rate multiplier. Rapid Fire,
  the projectile cap, projectile speed and hitboxes retain their behavior.
- Advanced/Elite still provide their permanent twin laser and one/two
  projectile guards per life. Standard hulls do not acquire extra guards.
- The shop and hangar show the role, both hull bonuses, base firepower, and
  the difference from the equipped hull at its actual owned stage.
- Base firepower compares theoretical total damage per second with Standard
  Grey Scout. It is not a promise of damage received by a particular enemy:
  misses, boss exposure and boss hit cooldowns still apply.
- All new copy is translated in the 19 selectable languages.

The damage/rate combination increases theoretical Standard firepower in
price order. Nova Wing gains 6.08% over the starter; Red Comet, the last
currently released Shard hull, gains 24.2%. The full set stays below a 50%
increase. Later hulls remain locked under the existing availability rules.

## Save compatibility

Fractional shot damage can leave a living enemy or boss with less than one
health point. Combat checkpoint validation preserves these positive values
and still rejects zero, negative, non-finite or out-of-range health. Tiny
floating-point residues at defeat are normalized to zero without rounding
the existing boss health scaling. In-flight saved shots retain their damage;
new shots use the selected hull profile after resume.

## Verification

- 60 combat, hull, shop, purchase, power-up and weapon regression tests passed.
- 35 backend checkpoint, account save/resume and API gateway tests passed.
- 12 localization tests and the static translation release gate passed.
- Frontend TypeScript/Vite build and backend TypeScript build passed.
- New tests cover all 20 hulls, every stage and weapon level, power-up
  composition, boss turret/core damage, all new translations, equipped-stage
  comparison and fractional health/projectile persistence through account
  save and resume.

These checks do not replace a hands-on Smartphone, Tablet or Pi Browser
playtest. The numerical balance is intentionally moderate and should be
reviewed with player feedback after release.
