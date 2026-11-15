import type { Locale } from '../../locales/config';

type Copy = [skip: string, setting: string];
const english: Copy = ['Skip intro', 'Story intros'];

const labels: Partial<Record<Locale, Copy>> = {
  de: ['Überspringen', 'Story-Vorspänne'],
  es: ['Saltar introducción', 'Introducciones de la historia'],
  fr: ['Passer l’introduction', 'Introductions de l’histoire'],
  pt: ['Saltar introdução', 'Introduções da história'],
  it: ['Salta introduzione', 'Introduzioni della storia'],
  pl: ['Pomiń wstęp', 'Wstępy fabularne'],
  tr: ['Girişi atla', 'Hikâye girişleri'],
  ru: ['Пропустить вступление', 'Сюжетные вступления'],
  hr: ['Preskoči uvod', 'Uvodne priče'],
  cs: ['Přeskočit úvod', 'Příběhové úvody'],
  sk: ['Preskočiť úvod', 'Príbehové úvody'],
  hu: ['Bevezető kihagyása', 'Történetbevezetők'],
  ro: ['Sari peste introducere', 'Introduceri de poveste'],
  sr: ['Прескочи увод', 'Уводне приче'],
  uk: ['Пропустити вступ', 'Сюжетні вступи'],
  th: ['ข้ามบทนำ', 'บทนำเนื้อเรื่อง'],
  zh: ['跳过序幕', '剧情序幕'],
  vi: ['Bỏ qua đoạn mở đầu', 'Đoạn mở đầu cốt truyện'],
};

export const storyCopy = (locale: Locale) => labels[locale] ?? english;
