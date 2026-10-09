export const seriesTranslations: Record<string, Record<string, string>> = {
 de: {
  "Not recorded": "nicht erfasst",
  "Expanded records use the current scoring rules. Run level belongs to that record; profile level shows career progress.": "Diese Rekorde gelten für die erweiterten Spielregeln. Das Lauf-Level gehört zum angezeigten Rekord; das Profillevel zeigt den höchsten Karrierefortschritt.",
  "Historical records use earlier scoring rules. Missing run levels were not recorded and cannot be recovered from today’s profile.": "Historische Rekorde gelten für frühere Spielregeln. Fehlende Lauf-Level wurden damals nicht erfasst und lassen sich nicht aus dem heutigen Profil ableiten.",
 },
 es: {
  "Not recorded": "no registrado",
  "Expanded records use the current scoring rules. Run level belongs to that record; profile level shows career progress.": "Estos récords usan las reglas ampliadas. El nivel de la partida corresponde al récord; el nivel del perfil muestra el progreso de la carrera.",
  "Historical records use earlier scoring rules. Missing run levels were not recorded and cannot be recovered from today’s profile.": "Los récords históricos usan reglas anteriores. Los niveles ausentes no se registraron y no pueden deducirse del perfil actual.",
 },
 zh: {
  "Not recorded": "未记录",
  "Expanded records use the current scoring rules. Run level belongs to that record; profile level shows career progress.": "这些纪录采用扩展后的游戏规则。单局等级对应所显示的纪录；档案等级表示生涯最高进度。",
  "Historical records use earlier scoring rules. Missing run levels were not recorded and cannot be recovered from today’s profile.": "历史纪录采用较早的计分规则。缺失的单局等级当时未被记录，不能根据当前档案推算。",
 },
 vi: {
  "Not recorded": "chưa được ghi lại",
  "Expanded records use the current scoring rules. Run level belongs to that record; profile level shows career progress.": "Các kỷ lục này dùng luật chơi mở rộng. Cấp của lượt chơi thuộc về kỷ lục đó; cấp hồ sơ thể hiện tiến trình cao nhất trong sự nghiệp.",
  "Historical records use earlier scoring rules. Missing run levels were not recorded and cannot be recovered from today’s profile.": "Kỷ lục lịch sử dùng luật tính điểm cũ. Cấp lượt chơi bị thiếu chưa được ghi lại và không thể suy ra từ hồ sơ hiện tại.",
 },
 fr: {"Not recorded":"non enregistré"}, pt:{"Not recorded":"não registrado"}, it:{"Not recorded":"non registrato"}, pl:{"Not recorded":"nie zarejestrowano"}, tr:{"Not recorded":"kaydedilmedi"}, ru:{"Not recorded":"не зафиксировано"}, hr:{"Not recorded":"nije zabilježeno"}, cs:{"Not recorded":"nezaznamenáno"}, sk:{"Not recorded":"nezaznamenané"}, hu:{"Not recorded":"nincs rögzítve"}, ro:{"Not recorded":"neînregistrat"}, sr:{"Not recorded":"није забележено"}, uk:{"Not recorded":"не зафіксовано"}, th:{"Not recorded":"ไม่ได้บันทึก"},
};

const downloadCopy: Record<string,string[]> = {
 de:['Speichern oder teilen','Bild zum Speichern öffnen','Halte das Bild gedrückt, um es zu speichern, oder nutze das Bildmenü deines Browsers.'],
 es:['Guardar o compartir','Abrir imagen para guardar','Mantén pulsada la imagen para guardarla o usa el menú de imágenes de tu navegador.'],
 zh:['保存或分享','打开图片以保存','长按图片即可保存，也可使用浏览器的图片菜单。'],
 vi:['Lưu hoặc chia sẻ','Mở ảnh để lưu','Nhấn giữ ảnh để lưu hoặc sử dụng menu hình ảnh của trình duyệt.'],
};
const downloadKeys=['Save or share','Open image to save','Hold the image to save it, or use your browser’s image menu.'];
for(const [locale,values] of Object.entries(downloadCopy)) for(const [index,key] of downloadKeys.entries()) seriesTranslations[locale][key]=values[index];

for(const [locale,value] of Object.entries({de:'Sprachen suchen',es:'Buscar idiomas',zh:'搜索语言',vi:'Tìm ngôn ngữ'})) seriesTranslations[locale]['Search languages']=value;
