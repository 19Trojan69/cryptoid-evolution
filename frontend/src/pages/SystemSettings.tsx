import { useEffect, useState } from "react";
import LanguagePicker from "../components/LanguagePicker";
import { languages, useLocale } from "../i18n";
import { CONTROL_HAND_KEY, CONTROL_SENSITIVITY_KEY, CONTROL_ZONE_KEY, SHIP_START_KEY, readControlHand, readControlSensitivity, readControlZone, readShipStart, type ControlHand, type ControlSensitivity, type ControlZone, type ShipStart } from "./controlPreferences";
import { VIBRATION_KEY, readVibrationEnabled, supportsVibration, gameHaptics } from "./gameHaptics";
import { requestGameFullscreen } from "./gameFullscreen";
import MusicVolumeSlider from "./MusicVolumeSlider";
import { MOTION_STORAGE_KEY, applySavedDisplaySettings, readReducedEffects, type SettingsSection } from './displaySettings';
type Props = { musicVolume: number; effectsVolume: number; changeMusicVolume: (value: number) => void; changeEffectsVolume: (value: number) => void; onChange?: () => void; idPrefix: string; initialSection?: SettingsSection; compactMobile?: boolean };
export default function SystemSettings({ musicVolume, effectsVolume, changeMusicVolume, changeEffectsVolume, onChange, idPrefix, initialSection, compactMobile = false }: Props) {
  const { locale, automatic, t } = useLocale();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(readReducedEffects);
  const [fullscreenStatus, setFullscreenStatus] = useState("");
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { applySavedDisplaySettings(); setReducedEffects(readReducedEffects()); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const fullScreen = () => {
    void requestGameFullscreen().then(result => setFullscreenStatus(result === "unavailable" ? "This browser does not support full screen. Use the installed app for a view without the address bar." : result === "denied" ? "The browser did not allow full screen. You can continue playing in this view." : ""));
  };
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
            <button type="button" className="language-trigger language-change" aria-haspopup="dialog" onClick={() => setLanguageMenuOpen(true)}><span aria-hidden="true">◎</span><b>{automatic ? t('Automatic (device language)') : languages[locale]}</b><i aria-hidden="true">⌄</i></button>
            {languageMenuOpen && <LanguagePicker onClose={() => setLanguageMenuOpen(false)} />}
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
            <button className="system-setting" type="button" onClick={fullScreen}><span aria-hidden="true">⛶</span><b>{t('Full screen')}</b></button>
            {fullscreenStatus && <p role="status" className="fullscreen-status">{t(fullscreenStatus)}</p>}
            <button className="system-setting" type="button" disabled={!supportsVibration()} aria-pressed={vibrationEnabled && supportsVibration()} onClick={() => { const enabled = !vibrationEnabled; localStorage.setItem(VIBRATION_KEY, enabled ? "on" : "off"); setVibrationEnabled(enabled); onChange?.(); if (!enabled) gameHaptics.stop(); }}><span aria-hidden="true">≋</span><b>{t(!supportsVibration() ? "Vibration unavailable" : vibrationEnabled ? "Vibration on" : "Vibration off")}</b></button>
            <button className="system-setting" type="button" aria-pressed={reducedEffects} onClick={() => { const reduced = !reducedEffects; localStorage.setItem(MOTION_STORAGE_KEY, reduced ? "1" : "0"); applySavedDisplaySettings(); setReducedEffects(readReducedEffects()); if (reduced) gameHaptics.stop(); onChange?.(); }}><span aria-hidden="true">◌</span><b>{t(reducedEffects ? 'Reduced effects' : 'Standard effects')}</b></button>
          </div>
  </>;
}
