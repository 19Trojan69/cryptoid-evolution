import { factionEmblem } from './cardFaction';
import { cardCanvasDimensions } from './cardDownload';
import { translate } from '../i18n.ts';
import { normalizeLocale, localeDirection } from '../locales/config.ts';
import type { CollectionCard } from './collectionData';
import { loadBossArtwork, loadCardImage } from './bossArtwork';
import { wrapCardText } from './cardTextLayout';
import { loadShipArtwork } from './shipArtwork';

/** Measure every line before allocating the PNG. The footer is below, not over, the content. */
export async function exportCollectionCard(card: CollectionCard, language: boolean | string, stars = 0): Promise<Blob> {
  const locale=typeof language==='boolean'?(language?'de':'en'):normalizeLocale(language)??'en', de=locale==='de';
  const t=(source:string)=>translate(locale,source), rtl=localeDirection(locale)==='rtl';
  await document.fonts.ready;
  const [art, space, emblem] = await Promise.all([
    card.bossId ? loadBossArtwork(card.bossId, 1200) : loadShipArtwork(card.image, card.color),
    loadCardImage(card.background),
    loadCardImage(factionEmblem(card.key)),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const wrap = (text: string, size: number, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
    return wrapCardText(text, 1000, line => ctx.measureText(line).width);
  };
  const title = wrap(card.name, 66, true), subtitle = wrap(card.subtitle, 30);
  const category = wrap(`${card.category.toUpperCase()}  ${'✦'.repeat(card.tier)}${card.bossId ? '  ' + '★'.repeat(Math.max(0, Math.min(3, stars))) : ''}`, 23, true);
  const stats = card.stats.map(([label, value]) => wrap(`${label}: ${value}`, 28));
  const sections = [
    { heading: de ? 'SCHIFFSGESCHICHTE' : t('SHIP HISTORY'), paragraphs: card.story },
    { heading: de ? 'AKTUELLE AUSRÜSTUNG' : t('CURRENT EQUIPMENT'), paragraphs: card.equipment },
  ].map(section => ({ heading: wrap(section.heading, 28, true), paragraphs: section.paragraphs.map(text => wrap(text, 30)) }));
  const footer = wrap(de
    ? 'SAMMELKARTE · Fiktion aus dem Cryptoid-Universum / tatsächliche Spielwerte · Edition 01'
    : t('COLLECTOR CARD · Fiction from the Cryptoid universe / actual game stats · Edition 01'), 22);
  const intro = 160 + title.length * 78 + subtitle.length * 42 + 22 + category.length * 34 + 30;
  const statsHeight = stats.reduce((sum, lines) => sum + lines.length * 42, 0);
  const bodyHeight = sections.reduce((sum, section) => sum + section.heading.length * 40 + 14
    + section.paragraphs.reduce((height, lines) => height + lines.length * 44 + 26, 0) + 30, 0);
  const logicalHeight = Math.ceil(intro + 475 + 46 + statsHeight + 32 + bodyHeight + 50 + footer.length * 32 + 70);
  const dimensions = cardCanvasDimensions(logicalHeight);
  canvas.width = dimensions.width; canvas.height = dimensions.height;
  ctx.scale(dimensions.scale, dimensions.scale);
  const colors = ['#b4a2d1', '#bd9fe8', '#d9acff', '#e4b66c', '#ff91bd'];
  const accent = colors[Math.min(4, card.tier - 1)];
  ctx.fillStyle = '#101525'; ctx.fillRect(0, 0, 1200, logicalHeight);
  const spaceHeight = 1200 * space.height / space.width;
  ctx.drawImage(space, 0, 0, 1200, spaceHeight);
  const shade = ctx.createLinearGradient(0, 0, 0, spaceHeight);
  shade.addColorStop(0, 'rgba(4,10,20,.34)'); shade.addColorStop(.35, 'rgba(4,10,20,.45)');
  shade.addColorStop(.75, 'rgba(4,10,20,.95)'); shade.addColorStop(1, '#101525');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 1200, spaceHeight);
  const metal = ctx.createLinearGradient(0, 0, 1200, logicalHeight);
  metal.addColorStop(0, '#ece1ff'); metal.addColorStop(.2, accent); metal.addColorStop(.48, '#5b426c'); metal.addColorStop(.53, '#f2deff'); metal.addColorStop(1, '#b78665');
  ctx.strokeStyle = metal; ctx.lineWidth = 8; ctx.strokeRect(25, 25, 1150, logicalHeight - 50);
  ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.strokeRect(40, 40, 1120, logicalHeight - 80); ctx.globalAlpha = 1;
  ctx.drawImage(emblem, 1000, 62, 80, 80);
  let y = 100;
  ctx.fillStyle = accent; ctx.font = 'bold 25px sans-serif'; ctx.fillText(`CRYPTOID EVOLUTION · ${card.serial}`, 100, y); y += 60;
  const paint = (lines: string[], size: number, advance: number, color: string, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`; ctx.fillStyle = color;
    ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';
    for (const line of lines) { ctx.fillText(line, rtl?1100:100, y); y += advance; }
  };
  paint(title, 66, 78, '#f2f4fa', true); paint(subtitle, 30, 42, accent);
  y += 22; paint(category, 23, 34, accent, true); y += 30;
  const scale = Math.min(1000 / art.width, 440 / art.height);
  ctx.drawImage(art, 600 - art.width * scale / 2, y + (440 - art.height * scale) / 2, art.width * scale, art.height * scale);
  y += 475; ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(1100, y); ctx.stroke(); y += 46;
  for (const lines of stats) paint(lines, 28, 42, '#e1e7ef');
  y += 32;
  for (const section of sections) {
    paint(section.heading, 28, 40, accent, true); y += 14;
    for (const paragraph of section.paragraphs) { paint(paragraph, 30, 44, '#e0e7ef'); y += 26; }
    y += 30;
  }
  y += 50; paint(footer, 22, 32, accent);
  if (y > logicalHeight - 60) throw new Error('Card layout exceeded its measured height');
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    canvas.width = 0; canvas.height = 0;
    if (blob && blob.size > 8 && blob.type === 'image/png') resolve(blob); else reject(new Error('PNG export failed'));
  }, 'image/png'));
}
