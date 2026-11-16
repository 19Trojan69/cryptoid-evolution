import type { Locale } from '../../locales/config';

type Copy = [skip: string, setting: string, retryAudio: string];
const english: Copy = ['Skip intro', 'Story intros', 'Play audio'];

const labels: Partial<Record<Locale, Copy>> = {
  de: ['Überspringen', 'Story-Vorspänne', 'Ton abspielen'],
  es: ['Saltar introducción', 'Introducciones de la historia', 'Reproducir audio'],
  fr: ['Passer l’introduction', 'Introductions de l’histoire', 'Lire l’audio'],
  pt: ['Saltar introdução', 'Introduções da história', 'Reproduzir áudio'],
  it: ['Salta introduzione', 'Introduzioni della storia', 'Riproduci audio'],
  pl: ['Pomiń wstęp', 'Wstępy fabularne', 'Odtwórz dźwięk'],
  tr: ['Girişi atla', 'Hikâye girişleri', 'Sesi oynat'],
  ru: ['Пропустить вступление', 'Сюжетные вступления', 'Включить звук'],
  hr: ['Preskoči uvod', 'Uvodne priče', 'Reproduciraj zvuk'],
  cs: ['Přeskočit úvod', 'Příběhové úvody', 'Přehrát zvuk'],
  sk: ['Preskočiť úvod', 'Príbehové úvody', 'Prehrať zvuk'],
  hu: ['Bevezető kihagyása', 'Történetbevezetők', 'Hang lejátszása'],
  ro: ['Sari peste introducere', 'Introduceri de poveste', 'Redă sunetul'],
  sr: ['Прескочи увод', 'Уводне приче', 'Пусти звук'],
  uk: ['Пропустити вступ', 'Сюжетні вступи', 'Увімкнути звук'],
  th: ['ข้ามบทนำ', 'บทนำเนื้อเรื่อง', 'เล่นเสียง'],
  zh: ['跳过序幕', '剧情序幕', '播放音频'],
  vi: ['Bỏ qua đoạn mở đầu', 'Đoạn mở đầu cốt truyện', 'Phát âm thanh'],
};

export const storyCopy = (locale: Locale) => labels[locale] ?? english;
