import type { Locale } from '../../locales/config';

type Copy = [skip: string, setting: string, retryAudio: string];
const english: Copy = ['Skip', 'Story intros', 'Play audio'];

const labels: Partial<Record<Locale, Copy>> = {
  de: ['Überspringen', 'Story-Vorspänne', 'Ton abspielen'],
  es: ['Saltar', 'Introducciones de la historia', 'Reproducir audio'],
  fr: ['Passer', 'Introductions de l’histoire', 'Lire l’audio'],
  pt: ['Pular', 'Introduções da história', 'Reproduzir áudio'],
  it: ['Salta', 'Introduzioni della storia', 'Riproduci audio'],
  pl: ['Pomiń', 'Wstępy fabularne', 'Odtwórz dźwięk'],
  tr: ['Atla', 'Hikâye girişleri', 'Sesi oynat'],
  ru: ['Пропустить', 'Сюжетные вступления', 'Включить звук'],
  hr: ['Preskoči', 'Uvodne priče', 'Reproduciraj zvuk'],
  cs: ['Přeskočit', 'Příběhové úvody', 'Přehrát zvuk'],
  sk: ['Preskočiť', 'Príbehové úvody', 'Prehrať zvuk'],
  hu: ['Kihagyás', 'Történetbevezetők', 'Hang lejátszása'],
  ro: ['Sari peste', 'Introduceri de poveste', 'Redă sunetul'],
  sr: ['Прескочи', 'Уводне приче', 'Пусти звук'],
  uk: ['Пропустити', 'Сюжетні вступи', 'Увімкнути звук'],
  th: ['ข้าม', 'บทนำเนื้อเรื่อง', 'เล่นเสียง'],
  zh: ['跳过', '剧情序幕', '播放音频'],
  vi: ['Bỏ qua', 'Đoạn mở đầu cốt truyện', 'Phát âm thanh'],
};

export const storyCopy = (locale: Locale) => labels[locale] ?? english;
