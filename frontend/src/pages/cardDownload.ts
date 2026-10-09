export const cardFilename = (name: string, serial: string) => `Cryptoid-Evolution_${name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'Card'}_${serial.replace(/[^a-zA-Z0-9-]+/g, '-')}.png`;
export const canShareCard = (blob: Blob, filename: string): boolean => {
 try { return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] }); } catch { return false; }
};
export const shareCard = async (blob: Blob, filename: string) => {
 await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] });
};
// Keep logical measurements unchanged while bounding the physical canvas memory.
export const cardCanvasDimensions = (logicalHeight: number) => {
 if (!Number.isFinite(logicalHeight) || logicalHeight < 1) throw new Error('Invalid card height');
 const scale = Math.min(1, 8192 / logicalHeight, Math.sqrt(4_000_000 / (1200 * logicalHeight)));
 return { width: Math.ceil(1200 * scale), height: Math.ceil(logicalHeight * scale), scale };
};
