import type { Locale } from '../../locales/config';

type Copy = [play: string, skip: string, disable: string, setting: string];
const english: Copy = ['Play intro', 'Skip intro', 'Turn off intros', 'Story intros'];

const labels: Partial<Record<Locale, Copy>> = {
  de: ['Vorspann abspielen', 'Überspringen', 'Vorspänne abschalten', 'Story-Vorspänne'],
  es: ['Reproducir introducción', 'Saltar introducción', 'Desactivar introducciones', 'Introducciones de la historia'],
  fr: ['Lire l’introduction', 'Passer l’introduction', 'Désactiver les introductions', 'Introductions de l’histoire'],
  pt: ['Reproduzir introdução', 'Saltar introdução', 'Desativar introduções', 'Introduções da história'],
  it: ['Riproduci introduzione', 'Salta introduzione', 'Disattiva introduzioni', 'Introduzioni della storia'],
  pl: ['Odtwórz wstęp', 'Pomiń wstęp', 'Wyłącz wstępy', 'Wstępy fabularne'],
  tr: ['Girişi oynat', 'Girişi atla', 'Girişleri kapat', 'Hikâye girişleri'],
  ru: ['Смотреть вступление', 'Пропустить вступление', 'Отключить вступления', 'Сюжетные вступления'],
  hr: ['Pokreni uvod', 'Preskoči uvod', 'Isključi uvode', 'Uvodne priče'],
  cs: ['Přehrát úvod', 'Přeskočit úvod', 'Vypnout úvody', 'Příběhové úvody'],
  sk: ['Prehrať úvod', 'Preskočiť úvod', 'Vypnúť úvody', 'Príbehové úvody'],
  hu: ['Bevezető lejátszása', 'Bevezető kihagyása', 'Bevezetők kikapcsolása', 'Történetbevezetők'],
  ro: ['Redă introducerea', 'Sari peste introducere', 'Dezactivează introducerile', 'Introduceri de poveste'],
  sr: ['Покрени увод', 'Прескочи увод', 'Искључи уводе', 'Уводне приче'],
  uk: ['Відтворити вступ', 'Пропустити вступ', 'Вимкнути вступи', 'Сюжетні вступи'],
  th: ['เล่นบทนำ', 'ข้ามบทนำ', 'ปิดบทนำ', 'บทนำเนื้อเรื่อง'],
  zh: ['播放序幕', '跳过序幕', '关闭序幕', '剧情序幕'],
  vi: ['Phát đoạn mở đầu', 'Bỏ qua đoạn mở đầu', 'Tắt các đoạn mở đầu', 'Đoạn mở đầu cốt truyện'],
};

export const storyCopy = (locale: Locale) => labels[locale] ?? english;
