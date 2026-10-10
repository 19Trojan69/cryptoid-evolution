import { useEffect } from "react";
import { hasExplicitTranslation, translate, type TranslationParams } from "./i18n.ts";

const adminLabels: Record<string, string> = {
  "Advanced": "Fortgeschritten", "Overdrive": "Leistungsboost", "Rapid": "Schnellfeuer",
  "Start Overdrive": "Start-Leistungsboost", "Home-Musik": "Startseitenmusik",
};

// Admin copy is authored in German. Never fall back to the English admin catalog.
export const adminText = (source: string, params: TranslationParams = {}) => {
  const text = (adminLabels[source] ?? (hasExplicitTranslation("de", source) ? translate("de", source) : source))
    .replace(/\bAdvanced\b/g, "Fortgeschritten");
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder);
};

export const useAdminLocale = () => {
  useEffect(() => {
    document.documentElement.lang = "de";
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.complexScript = "false";
  }, []);
  return { locale: "de" as const, t: adminText };
};
