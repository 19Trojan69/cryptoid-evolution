import { useEffect, useState } from "react";
import { languages, useLocale, type Locale } from "../i18n";
import { CONTROL_HAND_KEY, CONTROL_SENSITIVITY_KEY, CONTROL_ZONE_KEY, SHIP_START_KEY, readControlHand, readControlSensitivity, readControlZone, readShipStart, type ControlHand, type ControlSensitivity, type ControlZone, type ShipStart } from "./controlPreferences";
import { VIBRATION_KEY, readVibrationEnabled, supportsVibration, gameHaptics } from "./gameHaptics";
import { requestGameFullscreen } from "./gameFullscreen";
import MusicVolumeSlider from "./MusicVolumeSlider";
export const MOTION_STORAGE_KEY = "cryptoid_reduced_effects";
export const applySavedDisplaySettings = () => { document.documentElement.dataset.motion = localStorage.getItem(MOTION_STORAGE_KEY) === "1" ? "reduced" : "standard"; };
export type SettingsSection = "language" | "controls" | "audio" | "display";
type Props = { musicVolume: number; effectsVolume: number; changeMusicVolume: (value: number) => void; changeEffectsVolume: (value: number) => void; onChange?: () => void; idPrefix: string; initialSection?: SettingsSection; compactMobile?: boolean };
export default function SystemSettings({ musicVolume, effectsVolume, changeMusicVolume, changeEffectsVolume, onChange, idPrefix, initialSection, compactMobile = false }: Props) {
  const { locale, automatic, choose, t } = useLocale();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(() => localStorage.getItem(MOTION_STORAGE_KEY) === "1");
  const [controlHand, setControlHand] = useState<ControlHand>(readControlHand);
  const [controlSensitivity, setControlSensitivity] = useState<ControlSensitivity>(readControlSensitivity);
  const [controlZone, setControlZone] = useState<ControlZone>(readControlZone);
  const [vibrationEnabled, setVibrationEnabled] = useState(readVibrationEnabled);
  const [shipStart, setShipStart] = useState<ShipStart>(readShipStart);
  const [mobileSection, setMobileSection] = useState<SettingsSection | null>(initialSection ?? null);
  const openMobileSection = (section: SettingsSection | null) => {
    setMobileSection(section);
    requestAnimationFrame(() => {
      const target = document.getElementById(section ? `${idPrefix}-settings-${section}` : `${idPrefix}-settings-overview`);
      target?.scrollIntoView({ block: "nearest" });
      if (section) target?.focus({ preventScroll: true });
      else target?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    if (!initialSection) return;
    const frame = requestAnimationFrame(() => { const section = document.getElementById(`${idPrefix}-settings-${initialSection}`); section?.scrollIntoView({ block: "start" }); section?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(frame);
  }, [idPrefix, initialSection]);
  return <>
          {compactMobile && <nav className="mobile-settings-nav" id={`${idPrefix}-settings-overview`} aria-label={t("System menu")}>
            {mobileSection ? <button type="button" className="mobile-settings-back" onClick={() => openMobileSection(null)}>← {t("All settings")}</button> : (["audio", "controls", "language", "display"] as const).map(section => <button key={section} type="button" className="mobile-settings-row" aria-controls={`${idPrefix}-settings-${section}`} aria-expanded={false} onClick={() => openMobileSection(section)}><b>{t(section === "audio" ? "Music & effects" : section === "controls" ? "Controls" : section === "language" ? "Language" : "Display")}</b><span>{section === "audio" ? `${musicVolume}%` : section === "controls" ? t(controlHand === "right" ? "Right-handed" : "Left-handed") : section === "language" ? languages[locale] : ""}<i aria-hidden="true">›</i></span></button>)}
          </nav>}
          <div className={`system-menu-section${compactMobile ? " mobile-settings-section" : ""}`} data-mobile-active={mobileSection === "language"} id={`${idPrefix}-settings-language`} tabIndex={-1}>
            <div className="system-menu-heading"><strong>{t('Language')}</strong><small>{t('Current language')}: {languages[locale]}</small></div>
            <div className="language-dropdown" data-open={languageMenuOpen ? "true" : "false"}>
              <div className="language-actions">
                <button type="button" className="language-trigger language-auto" aria-pressed={automatic} aria-expanded={languageMenuOpen} aria-controls={`${idPrefix}-language-options`} onClick={() => { choose(null); setLanguageMenuOpen(true); }}>
                  <span aria-hidden="true">◎</span><b>{t('Automatic (device language)')}</b><i aria-hidden="true">⌄</i>
                </button>
                <button type="button" className="language-trigger language-change" aria-pressed={!automatic} aria-expanded={languageMenuOpen} aria-controls={`${idPrefix}-language-options`} onClick={() => setLanguageMenuOpen(open => !open)}>
                  <span aria-hidden="true">{locale.toUpperCase()}</span><b>{t('Change')}</b><i aria-hidden="true">⌄</i>
                </button>
              </div>
              {languageMenuOpen && <div id={`${idPrefix}-language-options`} className="language-menu" role="group" aria-label={t('Language')}>
                {Object.entries(languages).map(([code, label]) => <button type="button" className="language-option" key={code} aria-pressed={!automatic && locale === code} onClick={() => { choose(code as Locale); setLanguageMenuOpen(false); }}><span aria-hidden="true">{code.toUpperCase()}</span><b>{label}</b></button>)}
              </div>}
            </div>
          </div>
          <div className={`system-menu-section system-quick-settings${compactMobile ? " mobile-settings-section" : ""}`} data-mobile-active={mobileSection === "controls"} id={`${idPrefix}-settings-controls`} tabIndex={-1}>
            <div className="system-menu-heading"><strong>{t('Controls')}</strong><small>{t('Move with one thumb; activate power-ups with the other.')}</small></div>
            <button className="system-setting" type="button" aria-pressed={controlHand === "right"} onClick={() => { localStorage.setItem(CONTROL_HAND_KEY, "right"); setControlHand("right"); onChange?.(); }}><span aria-hidden="true">◁</span><b>{t('Right-handed controls')}</b></button>
            <button className="system-setting" type="button" aria-pressed={controlHand === "left"} onClick={() => { localStorage.setItem(CONTROL_HAND_KEY, "left"); setControlHand("left"); onChange?.(); }}><span aria-hidden="true">▷</span><b>{t('Left-handed controls')}</b></button>
            <div className="control-choice-group" role="group" aria-label={t('Touch sensitivity')}>
              <strong>{t('Touch sensitivity')}</strong>
              {(["gentle", "normal", "fast"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={controlSensitivity === value} onClick={() => { localStorage.setItem(CONTROL_SENSITIVITY_KEY, value); setControlSensitivity(value); onChange?.(); }}><b>{t(value === "gentle" ? "Gentle" : value === "normal" ? "Normal" : "Fast")}</b></button>)}
            </div>
            <div className="control-choice-group" role="group" aria-label={t('Control area')}>
              <strong>{t('Control area')}</strong>
              {(["compact", "normal", "wide"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={controlZone === value} onClick={() => { localStorage.setItem(CONTROL_ZONE_KEY, value); setControlZone(value); onChange?.(); }}><b>{t(value === "compact" ? "Compact" : value === "normal" ? "Normal" : "Wide")}</b></button>)}
            </div>
            <div className="control-choice-group ship-start-choice-group" role="group" aria-label={t('Ship start position')}>
              <strong>{t('Ship start position')}</strong>
              {(["higher", "touch"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={shipStart === value} onClick={() => { localStorage.setItem(SHIP_START_KEY, value); setShipStart(value); onChange?.(); }}><b>{t(value === "higher" ? "Above finger" : "Under finger")}</b></button>)}
            </div>
          </div>
          <div className={`system-menu-section system-quick-settings${compactMobile ? " mobile-settings-section" : ""}`} data-mobile-active={mobileSection === "audio"} id={`${idPrefix}-settings-audio`} tabIndex={-1}>
            <div className="system-menu-heading"><strong>{t('Music volume')}</strong></div>
            <MusicVolumeSlider id={`${idPrefix}-music-volume`} label={t('Music volume')} value={musicVolume} onChange={changeMusicVolume} />
            <MusicVolumeSlider id={`${idPrefix}-effects-volume`} label={t('Effects volume')} value={effectsVolume} onChange={changeEffectsVolume} />
          </div>
          <div className={`system-menu-section system-quick-settings${compactMobile ? " mobile-settings-section" : ""}`} data-mobile-active={mobileSection === "display"} id={`${idPrefix}-settings-display`} tabIndex={-1}>
            <div className="system-menu-heading"><strong>{t('Display')}</strong></div>
            <button className="system-setting" type="button" onClick={() => requestGameFullscreen()}><span aria-hidden="true">⛶</span><b>{t('Full screen')}</b></button>
            <button className="system-setting" type="button" disabled={!supportsVibration()} aria-pressed={vibrationEnabled && supportsVibration()} onClick={() => { const enabled = !vibrationEnabled; localStorage.setItem(VIBRATION_KEY, enabled ? "on" : "off"); setVibrationEnabled(enabled); onChange?.(); if (!enabled) gameHaptics.stop(); }}><span aria-hidden="true">≋</span><b>{t(!supportsVibration() ? "Vibration unavailable" : vibrationEnabled ? "Vibration on" : "Vibration off")}</b></button>
            <button className="system-setting" type="button" aria-pressed={reducedEffects} onClick={() => { const reduced = !reducedEffects; localStorage.setItem(MOTION_STORAGE_KEY, reduced ? "1" : "0"); applySavedDisplaySettings(); setReducedEffects(reduced); if (reduced) gameHaptics.stop(); onChange?.(); }}><span aria-hidden="true">◌</span><b>{t(reducedEffects ? 'Reduced effects' : 'Standard effects')}</b></button>
          </div>
  </>;
}
