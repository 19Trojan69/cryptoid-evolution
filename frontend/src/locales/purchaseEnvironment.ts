const source = "Buy with Pi";
const entries: Record<string, string> = { de: "Mit Pi kaufen", es: "Comprar con Pi", fr: "Acheter avec Pi", pt: "Comprar com Pi", it: "Acquista con Pi", pl: "Kup za Pi", tr: "Pi ile satın al", ru: "Купить за Pi", hr: "Kupi uz Pi", cs: "Koupit za Pi", sk: "Kúpiť za Pi", hu: "Vásárlás Pi-vel", ro: "Cumpără cu Pi", sr: "Купи уз Pi", uk: "Купити за Pi", th: "ซื้อด้วย Pi", zh: "使用 Pi 购买", vi: "Mua bằng Pi" };
export const purchaseEnvironmentTranslations = Object.fromEntries(Object.entries(entries).map(([locale, value]) => [locale, { [source]: value }]));
