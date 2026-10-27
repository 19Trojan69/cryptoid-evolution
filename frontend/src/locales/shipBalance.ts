export const shipBalanceKeys = [
  "Advanced: permanent twin fire with 15% more total damage than Standard, plus one enemy projectile hit of protection per mission.",
  "Elite: permanent twin fire with 30% more total damage than Standard, plus two enemy projectile hits of protection per mission. Requires Advanced.",
  "Hull protection is a limited pool for the whole mission. Losing or recovering hearts does not refill it. Active shields protect separately; ship collisions still cost one heart without a shield.",
  "Projectile protection per mission"
] as const;
const copy: Record<string, string[]> = {
  "en": [
    "Advanced: permanent twin fire with 15% more total damage than Standard, plus one enemy projectile hit of protection per mission.",
    "Elite: permanent twin fire with 30% more total damage than Standard, plus two enemy projectile hits of protection per mission. Requires Advanced.",
    "Hull protection is a limited pool for the whole mission. Losing or recovering hearts does not refill it. Active shields protect separately; ship collisions still cost one heart without a shield.",
    "Projectile protection per mission"
  ],
  "de": [
    "Advanced: dauerhaftes Doppelfeuer mit insgesamt 15 % mehr Schaden als Standard und Schutz vor einem gegnerischen Geschosstreffer pro Mission.",
    "Elite: dauerhaftes Doppelfeuer mit insgesamt 30 % mehr Schaden als Standard und Schutz vor zwei gegnerischen Geschosstreffern pro Mission. Advanced erforderlich.",
    "Der Rumpfschutz ist ein begrenzter Vorrat für die gesamte Mission. Verlorene oder wiederhergestellte Herzen füllen ihn nicht auf. Aktive Schilde schützen separat; Schiffskollisionen kosten ohne Schild weiterhin ein Herz.",
    "Geschossschutz pro Mission"
  ],
  "es": [
    "Advanced: fuego doble permanente con un 15 % más de daño total que Standard y protección contra un proyectil enemigo por misión.",
    "Elite: fuego doble permanente con un 30 % más de daño total que Standard y protección contra dos proyectiles enemigos por misión. Requiere Advanced.",
    "La protección del casco es una reserva limitada para toda la misión. Perder o recuperar corazones no la repone. Los escudos activos protegen por separado; las colisiones de naves sin escudo siguen costando un corazón.",
    "Protección contra proyectiles por misión"
  ],
  "fr": [
    "Advanced : tir double permanent avec 15 % de dégâts totaux de plus que Standard et une protection contre un projectile ennemi par mission.",
    "Elite : tir double permanent avec 30 % de dégâts totaux de plus que Standard et une protection contre deux projectiles ennemis par mission. Nécessite Advanced.",
    "La protection de la coque est une réserve limitée pour toute la mission. Perdre ou récupérer des cœurs ne la recharge pas. Les boucliers actifs protègent séparément ; les collisions sans bouclier coûtent toujours un cœur.",
    "Protection contre les projectiles par mission"
  ],
  "pt": [
    "Advanced: disparo duplo permanente com 15 % mais dano total que Standard e proteção contra um projétil inimigo por missão.",
    "Elite: disparo duplo permanente com 30 % mais dano total que Standard e proteção contra dois projéteis inimigos por missão. Requer Advanced.",
    "A proteção do casco é uma reserva limitada para toda a missão. Perder ou recuperar corações não a repõe. Os escudos ativos protegem separadamente; colisões sem escudo continuam a custar um coração.",
    "Proteção contra projéteis por missão"
  ],
  "it": [
    "Advanced: fuoco doppio permanente con il 15% di danni totali in più rispetto a Standard e protezione da un proiettile nemico per missione.",
    "Elite: fuoco doppio permanente con il 30% di danni totali in più rispetto a Standard e protezione da due proiettili nemici per missione. Richiede Advanced.",
    "La protezione dello scafo è una riserva limitata per tutta la missione. Perdere o recuperare cuori non la ripristina. Gli scudi attivi proteggono separatamente; le collisioni senza scudo costano comunque un cuore.",
    "Protezione dai proiettili per missione"
  ],
  "pl": [
    "Advanced: stały podwójny ogień, łącznie o 15% większe obrażenia niż Standard i ochrona przed jednym pociskiem wroga na misję.",
    "Elite: stały podwójny ogień, łącznie o 30% większe obrażenia niż Standard i ochrona przed dwoma pociskami wroga na misję. Wymaga Advanced.",
    "Ochrona kadłuba to ograniczona pula na całą misję. Utrata lub odzyskanie serc jej nie odnawia. Aktywne osłony chronią osobno; zderzenia statków bez osłony nadal kosztują jedno serce.",
    "Ochrona przed pociskami na misję"
  ],
  "tr": [
    "Advanced: Standard’a göre toplam %15 daha fazla hasarlı kalıcı çift atış ve görev başına bir düşman mermisine karşı koruma.",
    "Elite: Standard’a göre toplam %30 daha fazla hasarlı kalıcı çift atış ve görev başına iki düşman mermisine karşı koruma. Advanced gerektirir.",
    "Gövde koruması tüm görev için sınırlı bir haktır. Kalp kaybetmek veya geri kazanmak korumayı yenilemez. Aktif kalkanlar ayrıca korur; kalkansız gemi çarpışmaları yine bir kalbe mal olur.",
    "Görev başına mermi koruması"
  ],
  "ru": [
    "Advanced: постоянный двойной огонь с общим уроном на 15% выше Standard и защита от одного вражеского снаряда за миссию.",
    "Elite: постоянный двойной огонь с общим уроном на 30% выше Standard и защита от двух вражеских снарядов за миссию. Требуется Advanced.",
    "Защита корпуса — ограниченный запас на всю миссию. Потеря или восстановление сердец его не пополняет. Активные щиты защищают отдельно; столкновение без щита по-прежнему отнимает одно сердце.",
    "Защита от снарядов за миссию"
  ],
  "hr": [
    "Advanced: stalna dvostruka paljba s ukupno 15 % većom štetom od Standarda i zaštitom od jednog neprijateljskog projektila po misiji.",
    "Elite: stalna dvostruka paljba s ukupno 30 % većom štetom od Standarda i zaštitom od dva neprijateljska projektila po misiji. Zahtijeva Advanced.",
    "Zaštita trupa ograničena je zaliha za cijelu misiju. Gubitak ili vraćanje srca ne obnavlja je. Aktivni štitovi štite zasebno; sudari bez štita i dalje koštaju jedno srce.",
    "Zaštita od projektila po misiji"
  ],
  "cs": [
    "Advanced: trvalá dvojitá palba s celkovým poškozením o 15 % vyšším než Standard a ochranou před jedním nepřátelským projektilem za misi.",
    "Elite: trvalá dvojitá palba s celkovým poškozením o 30 % vyšším než Standard a ochranou před dvěma nepřátelskými projektily za misi. Vyžaduje Advanced.",
    "Ochrana trupu je omezená zásoba na celou misi. Ztráta ani obnovení srdcí ji nedoplní. Aktivní štíty chrání samostatně; srážky bez štítu stále stojí jedno srdce.",
    "Ochrana před projektily za misi"
  ],
  "sk": [
    "Advanced: trvalá dvojitá paľba s celkovým poškodením o 15 % vyšším než Standard a ochranou pred jedným nepriateľským projektilom za misiu.",
    "Elite: trvalá dvojitá paľba s celkovým poškodením o 30 % vyšším než Standard a ochranou pred dvoma nepriateľskými projektilmi za misiu. Vyžaduje Advanced.",
    "Ochrana trupu je obmedzená zásoba na celú misiu. Strata ani obnovenie sŕdc ju nedoplní. Aktívne štíty chránia samostatne; zrážky bez štítu stále stoja jedno srdce.",
    "Ochrana pred projektilmi za misiu"
  ],
  "hu": [
    "Advanced: állandó ikertűz a Standardnál összesen 15%-kal nagyobb sebzéssel és küldetésenként egy ellenséges lövedék elleni védelemmel.",
    "Elite: állandó ikertűz a Standardnál összesen 30%-kal nagyobb sebzéssel és küldetésenként két ellenséges lövedék elleni védelemmel. Advanced szükséges.",
    "A hajótest védelme az egész küldetésre korlátozott készlet. A szívek elvesztése vagy visszanyerése nem tölti újra. Az aktív pajzsok külön védenek; a pajzs nélküli ütközés továbbra is egy szívbe kerül.",
    "Lövedékvédelem küldetésenként"
  ],
  "ro": [
    "Advanced: foc dublu permanent cu daune totale cu 15% mai mari decât Standard și protecție împotriva unui proiectil inamic pe misiune.",
    "Elite: foc dublu permanent cu daune totale cu 30% mai mari decât Standard și protecție împotriva a două proiectile inamice pe misiune. Necesită Advanced.",
    "Protecția corpului este o rezervă limitată pentru întreaga misiune. Pierderea sau recuperarea inimilor nu o reface. Scuturile active protejează separat; coliziunile fără scut costă în continuare o inimă.",
    "Protecție contra proiectilelor pe misiune"
  ],
  "sr": [
    "Advanced: стална двострука паљба са укупно 15% већом штетом од Standard-а и заштитом од једног непријатељског пројектила по мисији.",
    "Elite: стална двострука паљба са укупно 30% већом штетом од Standard-а и заштитом од два непријатељска пројектила по мисији. Захтева Advanced.",
    "Заштита трупа је ограничена залиха за целу мисију. Губитак или враћање срца је не обнавља. Активни штитови штите засебно; судари без штита и даље коштају једно срце.",
    "Заштита од пројектила по мисији"
  ],
  "uk": [
    "Advanced: постійний подвійний вогонь із загальною шкодою на 15% вищою за Standard і захист від одного ворожого снаряда за місію.",
    "Elite: постійний подвійний вогонь із загальною шкодою на 30% вищою за Standard і захист від двох ворожих снарядів за місію. Потрібен Advanced.",
    "Захист корпусу — обмежений запас на всю місію. Втрата або відновлення сердець його не поповнює. Активні щити захищають окремо; зіткнення без щита й далі забирає одне серце.",
    "Захист від снарядів за місію"
  ],
  "th": [
    "Advanced: ยิงคู่ถาวร สร้างความเสียหายรวมมากกว่า Standard 15% และป้องกันกระสุนศัตรูได้หนึ่งครั้งต่อภารกิจ",
    "Elite: ยิงคู่ถาวร สร้างความเสียหายรวมมากกว่า Standard 30% และป้องกันกระสุนศัตรูได้สองครั้งต่อภารกิจ ต้องมี Advanced",
    "การป้องกันตัวเรือมีจำนวนจำกัดตลอดทั้งภารกิจ การเสียหรือฟื้นหัวใจไม่เติมการป้องกัน โล่ที่เปิดใช้งานป้องกันแยกต่างหาก การชนยานโดยไม่มีโล่ยังเสียหนึ่งหัวใจ",
    "การป้องกันกระสุนต่อภารกิจ"
  ],
  "zh": [
    "Advanced：永久双发射击，总伤害比 Standard 高 15%，每次任务可抵挡一发敌方弹丸。",
    "Elite：永久双发射击，总伤害比 Standard 高 30%，每次任务可抵挡两发敌方弹丸。需要 Advanced。",
    "机体防护是整次任务共用的有限次数。失去或恢复生命不会补充防护。启用的护盾独立提供保护；没有护盾时，战机碰撞仍会损失一颗心。",
    "每次任务的弹丸防护次数"
  ],
  "vi": [
    "Advanced: bắn đôi vĩnh viễn với tổng sát thương cao hơn Standard 15% và chống được một viên đạn địch mỗi nhiệm vụ.",
    "Elite: bắn đôi vĩnh viễn với tổng sát thương cao hơn Standard 30% và chống được hai viên đạn địch mỗi nhiệm vụ. Cần Advanced.",
    "Bảo vệ thân tàu là lượng dự trữ có hạn cho toàn bộ nhiệm vụ. Mất hoặc hồi tim không bổ sung bảo vệ. Khiên đang bật bảo vệ riêng; va chạm không có khiên vẫn mất một tim.",
    "Bảo vệ khỏi đạn mỗi nhiệm vụ"
  ]
};
export const shipBalanceTranslations = Object.fromEntries(Object.entries(copy).map(([locale, values]) => [locale, Object.fromEntries(shipBalanceKeys.map((key, index) => [key, values[index]]))]));
