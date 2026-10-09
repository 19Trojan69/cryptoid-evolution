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

const pilotKeys=["Crop avatar", "Could not process image. Choose another image.", "Use cropped image", "Cancel", "My pilot profile", "Pilot profile", "Loading…", "Profile unavailable. Please retry.", "Profile saved", "Short bio", "Country (optional)", "Search", "Not specified", "Avatar", "Upload image", "Remove image", "Achievement badges", "Choose up to three favorite badges. Service rank is separate.", "Unlocked", "Saving…", "Save profile", "Clear profile details", "Zoom", "Horizontal", "Vertical", "First boss", "Ten bosses", "Perfect formation", "High combo", "Golden fleet", "Galactic crown"];
const pilotCopy: Record<string,string[]> = {"de": ["Profilbild zuschneiden", "Das Bild konnte nicht verarbeitet werden. Wähle ein anderes Bild.", "Zugeschnittenes Bild verwenden", "Abbrechen", "Mein Pilotenprofil", "Pilotenprofil", "Wird geladen…", "Profil nicht verfügbar. Bitte erneut versuchen.", "Profil gespeichert", "Kurze Bio", "Herkunftsland (freiwillig)", "Suchen", "Keine Angabe", "Avatar", "Bild hochladen", "Bild entfernen", "Leistungsabzeichen", "Wähle bis zu drei Lieblingsabzeichen. Der Dienstgrad wird getrennt angezeigt.", "Freigeschaltet", "Wird gespeichert…", "Profil speichern", "Profilangaben entfernen", "Zoom", "Horizontal", "Vertikal", "Erster Boss", "Zehn Bosse", "Formation ohne Schaden", "Hohe Combo", "Goldene Flotte", "Galaktische Krone"], "es": ["Recortar avatar", "No se pudo procesar la imagen. Elige otra.", "Usar imagen recortada", "Cancelar", "Mi perfil de piloto", "Perfil de piloto", "Cargando…", "Perfil no disponible. Inténtalo de nuevo.", "Perfil guardado", "Biografía breve", "País (opcional)", "Buscar", "Sin especificar", "Avatar", "Subir imagen", "Eliminar imagen", "Insignias de logros", "Elige hasta tres insignias favoritas. El rango de servicio se muestra por separado.", "Desbloqueado", "Guardando…", "Guardar perfil", "Borrar datos del perfil", "Zoom", "Horizontal", "Vertical", "Primer jefe", "Diez jefes", "Formación sin daño", "Combo alto", "Flota dorada", "Corona galáctica"], "zh": ["裁剪头像", "无法处理图片。请选择其他图片。", "使用裁剪后的图片", "取消", "我的飞行员档案", "飞行员档案", "加载中…", "档案暂不可用，请重试。", "档案已保存", "简短介绍", "国家或地区（可选）", "搜索", "未指定", "头像", "上传图片", "移除图片", "成就徽章", "最多选择三个喜爱的徽章。军衔单独显示。", "已解锁", "保存中…", "保存档案", "清除档案信息", "缩放", "水平", "垂直", "首个首领", "十个首领", "无伤编队", "高连击", "黄金舰队", "银河王冠"], "vi": ["Cắt ảnh đại diện", "Không thể xử lý ảnh. Hãy chọn ảnh khác.", "Dùng ảnh đã cắt", "Hủy", "Hồ sơ phi công của tôi", "Hồ sơ phi công", "Đang tải…", "Hồ sơ chưa sẵn sàng. Vui lòng thử lại.", "Đã lưu hồ sơ", "Tiểu sử ngắn", "Quốc gia (không bắt buộc)", "Tìm kiếm", "Chưa xác định", "Ảnh đại diện", "Tải ảnh lên", "Xóa ảnh", "Huy hiệu thành tích", "Chọn tối đa ba huy hiệu yêu thích. Quân hàm được hiển thị riêng.", "Đã mở khóa", "Đang lưu…", "Lưu hồ sơ", "Xóa thông tin hồ sơ", "Thu phóng", "Ngang", "Dọc", "Trùm đầu tiên", "Mười trùm", "Đội hình không bị thương", "Combo cao", "Hạm đội vàng", "Vương miện thiên hà"]};
for (const [locale,values] of Object.entries(pilotCopy)) for (const [i,key] of pilotKeys.entries()) seriesTranslations[locale][key]=values[i];
