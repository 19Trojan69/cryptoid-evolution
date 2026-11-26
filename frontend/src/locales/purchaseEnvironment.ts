const source = "Buy with Pi";
const entries: Record<string, string> = { de: "Mit Pi kaufen", es: "Comprar con Pi", fr: "Acheter avec Pi", pt: "Comprar com Pi", it: "Acquista con Pi", pl: "Kup za Pi", tr: "Pi ile satın al", ru: "Купить за Pi", hr: "Kupi uz Pi", cs: "Koupit za Pi", sk: "Kúpiť za Pi", hu: "Vásárlás Pi-vel", ro: "Cumpără cu Pi", sr: "Купи уз Pi", uk: "Купити за Pi", th: "ซื้อด้วย Pi", zh: "使用 Pi 购买", vi: "Mua bằng Pi" };
const accountSource = "Your Pi Browser account does not match this game session. Sign in with the same Pi account before retrying.";
const accountEntries: Record<string, string> = {
  de: "Dein Pi-Browser-Konto passt nicht zu dieser Spielsitzung. Melde dich vor dem erneuten Versuch mit demselben Pi-Konto an.",
  es: "Tu cuenta de Pi Browser no coincide con esta sesión de juego. Inicia sesión con la misma cuenta de Pi antes de volver a intentarlo.",
  fr: "Votre compte Pi Browser ne correspond pas à cette session de jeu. Connectez-vous avec le même compte Pi avant de réessayer.",
  pt: "A tua conta do Pi Browser não corresponde a esta sessão de jogo. Entra com a mesma conta Pi antes de tentares novamente.",
  it: "Il tuo account Pi Browser non corrisponde a questa sessione di gioco. Accedi con lo stesso account Pi prima di riprovare.",
  pl: "Twoje konto Pi Browser nie pasuje do tej sesji gry. Zaloguj się na to samo konto Pi przed ponowną próbą.",
  tr: "Pi Browser hesabınız bu oyun oturumuyla eşleşmiyor. Yeniden denemeden önce aynı Pi hesabıyla giriş yapın.",
  ru: "Ваш аккаунт Pi Browser не соответствует этой игровой сессии. Перед повторной попыткой войдите в тот же аккаунт Pi.",
  hr: "Vaš Pi Browser račun ne odgovara ovoj sesiji igre. Prijavite se istim Pi računom prije ponovnog pokušaja.",
  cs: "Váš účet Pi Browser neodpovídá této herní relaci. Před dalším pokusem se přihlaste stejným účtem Pi.",
  sk: "Váš účet Pi Browser nezodpovedá tejto hernej relácii. Pred ďalším pokusom sa prihláste rovnakým účtom Pi.",
  hu: "A Pi Browser-fiókod nem egyezik ezzel a játékmenettel. Újrapróbálkozás előtt jelentkezz be ugyanazzal a Pi-fiókkal.",
  ro: "Contul tău Pi Browser nu corespunde acestei sesiuni de joc. Conectează-te cu același cont Pi înainte să încerci din nou.",
  sr: "Ваш Pi Browser налог не одговара овој сесији игре. Пријавите се истим Pi налогом пре поновног покушаја.",
  uk: "Ваш обліковий запис Pi Browser не відповідає цій ігровій сесії. Перед повторною спробою ввійдіть у той самий обліковий запис Pi.",
  th: "บัญชี Pi Browser ของคุณไม่ตรงกับเซสชันเกมนี้ โปรดเข้าสู่ระบบด้วยบัญชี Pi เดียวกันก่อนลองอีกครั้ง",
  zh: "你的 Pi Browser 账户与当前游戏会话不匹配。请先使用同一个 Pi 账户登录，再重试。",
  vi: "Tài khoản Pi Browser của bạn không khớp với phiên chơi này. Hãy đăng nhập bằng cùng tài khoản Pi trước khi thử lại.",
};
export const purchaseEnvironmentTranslations = Object.fromEntries(Object.entries(entries).map(([locale, value]) => [locale, { [source]: value, [accountSource]: accountEntries[locale] }]));
