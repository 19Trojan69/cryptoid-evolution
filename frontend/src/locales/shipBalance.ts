export const shipBalanceKeys = [
  "Advanced: permanent twin fire with 15% more total damage than Standard and a 10% larger pickup radius for normal power-ups.",
  "Elite: permanent twin fire with 30% more total damage than Standard and a 20% larger pickup radius for normal power-ups. Requires Advanced.",
  "Ship stages do not absorb hits. Active shields protect separately; armor determines your maximum hearts. The larger pickup radius applies only to normal power-ups, not boss hearts or bonus targets.",
  "Power-up pickup radius"
] as const;
const copy: Record<string, string[]> = {
  "en": [
    "Advanced: permanent twin fire with 15% more total damage than Standard and a 10% larger pickup radius for normal power-ups.",
    "Elite: permanent twin fire with 30% more total damage than Standard and a 20% larger pickup radius for normal power-ups. Requires Advanced.",
    "Ship stages do not absorb hits. Active shields protect separately; armor determines your maximum hearts. The larger pickup radius applies only to normal power-ups, not boss hearts or bonus targets.",
    "Power-up pickup radius"
  ],
  "de": [
    "Advanced: dauerhaftes Doppelfeuer mit insgesamt 15 % mehr Schaden als Standard und 10 % größerem Sammelradius für normale Power-ups.",
    "Elite: dauerhaftes Doppelfeuer mit insgesamt 30 % mehr Schaden als Standard und 20 % größerem Sammelradius für normale Power-ups. Advanced erforderlich.",
    "Die Schiffsstufen fangen keine Treffer ab. Aktive Schilde schützen separat; die Rüstung bestimmt deine maximalen Herzen. Der größere Sammelradius gilt nur für normale Power-ups, nicht für Bossherzen oder Bonusziele.",
    "Power-up-Sammelradius"
  ],
  "es": [
    "Advanced: fuego doble permanente con un 15 % más de daño total que Standard y un radio de recogida un 10 % mayor para potenciadores normales.",
    "Elite: fuego doble permanente con un 30 % más de daño total que Standard y un radio de recogida un 20 % mayor para potenciadores normales. Requiere Advanced.",
    "Los niveles de nave no absorben impactos. Los escudos activos protegen por separado; el blindaje determina el máximo de corazones. El mayor radio de recogida solo se aplica a potenciadores normales, no a corazones de jefes ni a objetivos de bonificación.",
    "Radio de recogida de potenciadores"
  ],
  "fr": [
    "Advanced : tir double permanent avec 15 % de dégâts totaux de plus que Standard et un rayon de ramassage des bonus normaux augmenté de 10 %.",
    "Elite : tir double permanent avec 30 % de dégâts totaux de plus que Standard et un rayon de ramassage des bonus normaux augmenté de 20 %. Nécessite Advanced.",
    "Les niveaux de vaisseau n'absorbent pas les impacts. Les boucliers actifs protègent séparément ; le blindage détermine le maximum de cœurs. Le rayon de ramassage accru concerne uniquement les bonus normaux, pas les cœurs de boss ni les cibles du défi bonus.",
    "Rayon de ramassage des bonus"
  ],
  "pt": [
    "Advanced: disparo duplo permanente com 15% mais dano total que Standard e um raio de recolha 10% maior para power-ups normais.",
    "Elite: disparo duplo permanente com 30% mais dano total que Standard e um raio de recolha 20% maior para power-ups normais. Requer Advanced.",
    "Os níveis da nave não absorvem impactos. Os escudos ativos protegem separadamente; a blindagem determina o máximo de corações. O raio de recolha maior aplica-se apenas a power-ups normais, não a corações de chefes nem a alvos de bónus.",
    "Raio de recolha de power-ups"
  ],
  "it": [
    "Advanced: fuoco doppio permanente con il 15% di danni totali in più rispetto a Standard e un raggio di raccolta dei potenziamenti normali maggiore del 10%.",
    "Elite: fuoco doppio permanente con il 30% di danni totali in più rispetto a Standard e un raggio di raccolta dei potenziamenti normali maggiore del 20%. Richiede Advanced.",
    "I livelli della nave non assorbono colpi. Gli scudi attivi proteggono separatamente; la corazza determina il massimo di cuori. Il raggio di raccolta maggiore vale solo per i potenziamenti normali, non per i cuori dei boss o i bersagli bonus.",
    "Raggio di raccolta dei potenziamenti"
  ],
  "pl": [
    "Advanced: stały podwójny ogień z łącznymi obrażeniami o 15% większymi niż Standard i promieniem zbierania zwykłych ulepszeń większym o 10%.",
    "Elite: stały podwójny ogień z łącznymi obrażeniami o 30% większymi niż Standard i promieniem zbierania zwykłych ulepszeń większym o 20%. Wymaga Advanced.",
    "Poziomy statku nie pochłaniają trafień. Aktywne tarcze chronią oddzielnie; pancerz określa maksymalną liczbę serc. Większy promień zbierania dotyczy tylko zwykłych ulepszeń, nie serc bossów ani celów bonusowych.",
    "Promień zbierania ulepszeń"
  ],
  "tr": [
    "Advanced: Standard'a göre toplam %15 daha fazla hasar veren kalıcı çift atış ve normal güçlendirmeler için %10 daha geniş toplama yarıçapı.",
    "Elite: Standard'a göre toplam %30 daha fazla hasar veren kalıcı çift atış ve normal güçlendirmeler için %20 daha geniş toplama yarıçapı. Advanced gerektirir.",
    "Gemi aşamaları isabetleri soğurmaz. Etkin kalkanlar ayrıca korur; zırh en yüksek kalp sayısını belirler. Daha geniş toplama yarıçapı yalnızca normal güçlendirmeler için geçerlidir; bölüm sonu düşmanlarının kalpleri ve bonus hedefleri için geçerli değildir.",
    "Güçlendirme toplama yarıçapı"
  ],
  "ru": [
    "Advanced: постоянный двойной огонь с общим уроном на 15% выше Standard и радиусом сбора обычных усилений на 10% больше.",
    "Elite: постоянный двойной огонь с общим уроном на 30% выше Standard и радиусом сбора обычных усилений на 20% больше. Требуется Advanced.",
    "Уровни корабля не поглощают попадания. Активные щиты защищают отдельно; броня определяет максимальное число сердец. Увеличенный радиус сбора действует только на обычные усиления, но не на сердца боссов и бонусные цели.",
    "Радиус сбора усилений"
  ],
  "hr": [
    "Advanced: trajna dvostruka paljba s ukupno 15% više štete od Standarda i 10% većim radijusom skupljanja običnih pojačanja.",
    "Elite: trajna dvostruka paljba s ukupno 30% više štete od Standarda i 20% većim radijusom skupljanja običnih pojačanja. Zahtijeva Advanced.",
    "Stupnjevi broda ne upijaju pogotke. Aktivni štitovi štite zasebno; oklop određuje najveći broj srca. Veći radijus skupljanja vrijedi samo za obična pojačanja, ne za srca šefova ni bonus mete.",
    "Radijus skupljanja pojačanja"
  ],
  "cs": [
    "Advanced: trvalá dvojitá palba s celkovým poškozením o 15 % vyšším než Standard a o 10 % větším dosahem sběru běžných vylepšení.",
    "Elite: trvalá dvojitá palba s celkovým poškozením o 30 % vyšším než Standard a o 20 % větším dosahem sběru běžných vylepšení. Vyžaduje Advanced.",
    "Stupně lodi nepohlcují zásahy. Aktivní štíty chrání samostatně; pancíř určuje maximální počet srdcí. Větší dosah sběru platí pouze pro běžná vylepšení, ne pro srdce bossů ani bonusové cíle.",
    "Dosah sběru vylepšení"
  ],
  "sk": [
    "Advanced: trvalá dvojitá paľba s celkovým poškodením o 15 % vyšším než Standard a o 10 % väčším dosahom zbierania bežných vylepšení.",
    "Elite: trvalá dvojitá paľba s celkovým poškodením o 30 % vyšším než Standard a o 20 % väčším dosahom zbierania bežných vylepšení. Vyžaduje Advanced.",
    "Stupne lode nepohlcujú zásahy. Aktívne štíty chránia samostatne; pancier určuje maximálny počet sŕdc. Väčší dosah zbierania platí iba pre bežné vylepšenia, nie pre srdcia bossov ani bonusové ciele.",
    "Dosah zbierania vylepšení"
  ],
  "hu": [
    "Advanced: állandó ikertűz a Standardnál összesen 15%-kal nagyobb sebzéssel és a normál erősítésekhez 10%-kal nagyobb begyűjtési sugárral.",
    "Elite: állandó ikertűz a Standardnál összesen 30%-kal nagyobb sebzéssel és a normál erősítésekhez 20%-kal nagyobb begyűjtési sugárral. Advanced szükséges.",
    "A hajófokozatok nem nyelnek el találatokat. Az aktív pajzsok külön védenek; a páncél határozza meg a szívek maximális számát. A nagyobb begyűjtési sugár csak a normál erősítésekre vonatkozik, a főellenfelek szíveire és a bónuszcélokra nem.",
    "Erősítések begyűjtési sugara"
  ],
  "ro": [
    "Advanced: foc dublu permanent cu daune totale cu 15% mai mari decât Standard și rază de colectare cu 10% mai mare pentru bonusurile normale.",
    "Elite: foc dublu permanent cu daune totale cu 30% mai mari decât Standard și rază de colectare cu 20% mai mare pentru bonusurile normale. Necesită Advanced.",
    "Treptele navei nu absorb lovituri. Scuturile active protejează separat; blindajul determină numărul maxim de inimi. Raza de colectare mărită se aplică doar bonusurilor normale, nu inimilor de la șefi sau țintelor bonus.",
    "Rază de colectare a bonusurilor"
  ],
  "sr": [
    "Advanced: стална двострука паљба са укупно 15% већом штетом од Standard-а и 10% већим радијусом сакупљања обичних појачања.",
    "Elite: стална двострука паљба са укупно 30% већом штетом од Standard-а и 20% већим радијусом сакупљања обичних појачања. Захтева Advanced.",
    "Степени брода не упијају поготке. Активни штитови штите засебно; оклоп одређује највећи број срца. Већи радијус сакупљања важи само за обична појачања, не за срца шефова или бонус мете.",
    "Радијус сакупљања појачања"
  ],
  "uk": [
    "Advanced: постійний подвійний вогонь із загальною шкодою на 15% вищою за Standard і на 10% більшим радіусом збирання звичайних підсилень.",
    "Elite: постійний подвійний вогонь із загальною шкодою на 30% вищою за Standard і на 20% більшим радіусом збирання звичайних підсилень. Потрібен Advanced.",
    "Рівні корабля не поглинають влучання. Активні щити захищають окремо; броня визначає максимальну кількість сердець. Збільшений радіус збирання діє лише на звичайні підсилення, а не на серця босів чи бонусні цілі.",
    "Радіус збирання підсилень"
  ],
  "th": [
    "Advanced: ยิงคู่ถาวร สร้างความเสียหายรวมมากกว่า Standard 15% และเพิ่มรัศมีเก็บพาวเวอร์อัปปกติ 10%",
    "Elite: ยิงคู่ถาวร สร้างความเสียหายรวมมากกว่า Standard 30% และเพิ่มรัศมีเก็บพาวเวอร์อัปปกติ 20% ต้องมี Advanced",
    "ระดับยานไม่ช่วยรับการโจมตี โล่ที่เปิดใช้งานป้องกันแยกต่างหาก เกราะกำหนดจำนวนหัวใจสูงสุด รัศมีเก็บที่เพิ่มขึ้นใช้กับพาวเวอร์อัปปกติเท่านั้น ไม่รวมใจจากบอสหรือเป้าหมายโบนัส",
    "รัศมีเก็บพาวเวอร์อัป"
  ],
  "zh": [
    "Advanced：永久双发射击，总伤害比 Standard 高 15%，普通强化道具的拾取半径扩大 10%。",
    "Elite：永久双发射击，总伤害比 Standard 高 30%，普通强化道具的拾取半径扩大 20%。需要 Advanced。",
    "飞船等级不会抵挡攻击。启用的护盾独立提供保护，装甲决定生命上限。扩大的拾取半径仅适用于普通强化道具，不适用于首领掉落的生命或奖励目标。",
    "强化道具拾取半径"
  ],
  "vi": [
    "Advanced: bắn đôi vĩnh viễn với tổng sát thương cao hơn Standard 15% và bán kính nhặt vật phẩm tăng sức mạnh thông thường lớn hơn 10%.",
    "Elite: bắn đôi vĩnh viễn với tổng sát thương cao hơn Standard 30% và bán kính nhặt vật phẩm tăng sức mạnh thông thường lớn hơn 20%. Cần Advanced.",
    "Cấp tàu không hấp thụ đòn đánh. Khiên đang bật bảo vệ riêng; giáp quyết định số tim tối đa. Bán kính nhặt lớn hơn chỉ áp dụng cho vật phẩm tăng sức mạnh thông thường, không áp dụng cho tim từ trùm hoặc mục tiêu thưởng.",
    "Bán kính nhặt vật phẩm tăng sức mạnh"
  ]
};
export const shipBalanceTranslations = Object.fromEntries(Object.entries(copy).map(([locale, values]) => [locale, Object.fromEntries(shipBalanceKeys.map((key, index) => [key, values[index]]))]));
