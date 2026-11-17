import type { Locale } from '../../locales/config';

type Copy = [skip: string, setting: string, retryAudio: string, cardUnlock: string];
const english: Copy = ['Skip', 'Story intros', 'Play audio', 'Victory Edition unlocked'];

const labels: Partial<Record<Locale, Copy>> = {
  de: ['Überspringen', 'Story-Vorspänne', 'Ton abspielen', 'Victory Edition freigeschaltet'],
  es: ['Saltar', 'Introducciones de la historia', 'Reproducir audio', 'Victory Edition desbloqueada'],
  fr: ['Passer', 'Introductions de l’histoire', 'Lire l’audio', 'Victory Edition débloquée'],
  pt: ['Pular', 'Introduções da história', 'Reproduzir áudio', 'Victory Edition desbloqueada'],
  it: ['Salta', 'Introduzioni della storia', 'Riproduci audio', 'Victory Edition sbloccata'],
  pl: ['Pomiń', 'Wstępy fabularne', 'Odtwórz dźwięk', 'Odblokowano Victory Edition'],
  tr: ['Atla', 'Hikâye girişleri', 'Sesi oynat', 'Victory Edition açıldı'],
  ru: ['Пропустить', 'Сюжетные вступления', 'Включить звук', 'Открыта карта Victory Edition'],
  hr: ['Preskoči', 'Uvodne priče', 'Reproduciraj zvuk', 'Victory Edition je otključana'],
  cs: ['Přeskočit', 'Příběhové úvody', 'Přehrát zvuk', 'Victory Edition odemčena'],
  sk: ['Preskočiť', 'Príbehové úvody', 'Prehrať zvuk', 'Victory Edition odomknutá'],
  hu: ['Kihagyás', 'Történetbevezetők', 'Hang lejátszása', 'Victory Edition feloldva'],
  ro: ['Sari peste', 'Introduceri de poveste', 'Redă sunetul', 'Victory Edition deblocată'],
  sr: ['Прескочи', 'Уводне приче', 'Пусти звук', 'Victory Edition је откључана'],
  uk: ['Пропустити', 'Сюжетні вступи', 'Увімкнути звук', 'Картку Victory Edition розблоковано'],
  th: ['ข้าม', 'บทนำเนื้อเรื่อง', 'เล่นเสียง', 'ปลดล็อก Victory Edition แล้ว'],
  zh: ['跳过', '剧情序幕', '播放音频', '已解锁 Victory Edition'],
  vi: ['Bỏ qua', 'Đoạn mở đầu cốt truyện', 'Phát âm thanh', 'Đã mở khóa Victory Edition'],
};

export const storyCopy = (locale: Locale) => labels[locale] ?? english;
