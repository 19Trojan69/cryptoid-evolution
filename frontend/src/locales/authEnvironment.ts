const source = "Browser sign-in is not configured for this environment. Open this page in Pi Browser to sign in.";
const translations: Record<string, string> = {
  de: "Die Browser-Anmeldung ist für diese Umgebung nicht eingerichtet. Öffne diese Seite zur Anmeldung im Pi Browser.",
  es: "El inicio de sesión del navegador no está configurado para este entorno. Abre esta página en Pi Browser para iniciar sesión.",
  fr: "La connexion dans le navigateur n’est pas configurée pour cet environnement. Ouvrez cette page dans Pi Browser pour vous connecter.",
  pt: "O início de sessão no navegador não está configurado para este ambiente. Abra esta página no Pi Browser para entrar.",
  it: "L’accesso dal browser non è configurato per questo ambiente. Apri questa pagina in Pi Browser per accedere.",
  pl: "Logowanie w przeglądarce nie jest skonfigurowane dla tego środowiska. Otwórz tę stronę w Pi Browser, aby się zalogować.",
  tr: "Bu ortam için tarayıcı girişi yapılandırılmamış. Giriş yapmak için bu sayfayı Pi Browser’da açın.",
  ru: "Вход через обычный браузер не настроен для этой среды. Откройте эту страницу в Pi Browser для входа.",
  hr: "Prijava u pregledniku nije konfigurirana za ovo okruženje. Otvorite ovu stranicu u Pi Browseru za prijavu.",
  cs: "Přihlášení v prohlížeči není pro toto prostředí nastaveno. Pro přihlášení otevřete tuto stránku v Pi Browseru.",
  sk: "Prihlásenie v prehliadači nie je pre toto prostredie nastavené. Na prihlásenie otvorte túto stránku v Pi Browseri.",
  hu: "A böngészős bejelentkezés nincs beállítva ebben a környezetben. A bejelentkezéshez nyisd meg ezt az oldalt a Pi Browserben.",
  ro: "Autentificarea în browser nu este configurată pentru acest mediu. Deschide această pagină în Pi Browser pentru autentificare.",
  sr: "Пријава у прегледачу није подешена за ово окружење. Отворите ову страницу у Pi Browser-у да бисте се пријавили.",
  uk: "Вхід через звичайний браузер не налаштовано для цього середовища. Відкрийте цю сторінку в Pi Browser для входу.",
  th: "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบผ่านเบราว์เซอร์สำหรับสภาพแวดล้อมนี้ โปรดเปิดหน้านี้ใน Pi Browser เพื่อเข้าสู่ระบบ",
  zh: "此环境尚未配置浏览器登录。请在 Pi Browser 中打开此页面以登录。",
  vi: "Chưa cấu hình đăng nhập bằng trình duyệt cho môi trường này. Hãy mở trang này trong Pi Browser để đăng nhập.",
};
export const authEnvironmentTranslations = Object.fromEntries(Object.entries(translations).map(([locale, value]) => [locale, { [source]: value }]));
