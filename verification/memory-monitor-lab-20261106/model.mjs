export const STORAGE_KEY = 'cryptoid_memory_lab_report_v1';
export const SAMPLE_MS = 5000;
export const MAX_SAMPLES = 360;
export const MAX_REPORT_CHARS = 512000;
export const ALERT_POLICY = {minActiveMs:10000,referenceSamples:3,growthRatio:1.5,minGrowthBytes:8*1048576,heapMinGrowthBytes:16*1048576,meaning:'relative resource growth, not a native RAM limit'};
export const RESOURCE_FIELDS=['paintedBytes','canvasCacheBytes','domCanvasLogicalBytes','audioBufferBytes','heapBytes'];
export const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
export const memoryMiB = value => finite(value) === null ? 'nicht verfügbar' : (value / 1048576).toFixed(1) + ' MiB';
export function clock(ms) {
  const s = Math.floor(Math.max(0, finite(ms) ?? 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
const numericFields = ['activeMs','unobservedGapMs','frames','frameMs','stage','level','bossId','reactorPercent','liveTurrets','enemies','playerShots','enemyShots','effects','domNodes','canvasNodes','domCanvasLogicalBytes','paintedBytes','paintedEntries','canvasCacheBytes','canvasSurfaceBytes','audioBufferBytes','audioVoices','pacedActive','pacedConfigured','heapBytes'];
export function cleanSample(raw, wallMs) {
  const sample = {wallMs:finite(wallMs) ?? 0, at:Date.now(), status:['playing','paused','loading','destroying','game-over','victory','unavailable'].includes(raw?.status) ? raw.status : 'unavailable'};
  for (const field of numericFields) sample[field] = finite(raw?.[field]);
  sample.phase = typeof raw?.phase === 'string' ? raw.phase.slice(0,32) : '';
  sample.encounter = typeof raw?.encounter === 'string' ? raw.encounter.slice(0,32) : '';
  sample.rulesMode = ['current','legacy'].includes(raw?.rulesMode) ? raw.rulesMode : null;
  return sample;
}
export function appendSample(report, sample) {
  report.samples.push(sample);
  updateReference(report);
  if (report.samples.length > MAX_SAMPLES) { report.samples.splice(0,report.samples.length-MAX_SAMPLES); report.dropped++; }
  return report;
}
export function updateReference(report){
  if(report.reference)return;
  const points=report.samples.filter(s=>s.status==='playing'&&s.activeMs>=ALERT_POLICY.minActiveMs).slice(0,ALERT_POLICY.referenceSamples);
  if(points.length<ALERT_POLICY.referenceSamples)return;
  const values={};
  for(const field of RESOURCE_FIELDS){const valid=points.map(s=>finite(s[field])).filter(v=>v!==null).sort((a,b)=>a-b);values[field]=valid.length===points.length?valid[1]:null;}
  report.reference={activeMs:points.at(-1).activeMs,values};
}
export function resourceHigh(value,field,reference){
  const baseline=finite(reference?.values?.[field]),current=finite(value);
  if(baseline===null||current===null)return false;
  const minimum=field==='heapBytes'?ALERT_POLICY.heapMinGrowthBytes:ALERT_POLICY.minGrowthBytes;
  return current>=baseline*ALERT_POLICY.growthRatio&&current-baseline>=minimum;
}
export function readReport(storage) {
  try {
    const text=storage.getItem(STORAGE_KEY);
    if (!text || text.length > MAX_REPORT_CHARS) return null;
    const r=JSON.parse(text);
    if (r?.schema !== 1 || !Array.isArray(r.samples) || r.samples.length > MAX_SAMPLES || !Number.isFinite(r.startedAt)) return null;
    if (!r.samples.every(s=>Number.isFinite(s.wallMs)&&s.wallMs>=0&&numericFields.every(k=>s[k]===null||finite(s[k])!==null))) return null;
    return r;
  } catch { return null; }
}
export function saveReport(storage, report) {
  try { const text=JSON.stringify(report); if(text.length>MAX_REPORT_CHARS)return false; storage.setItem(STORAGE_KEY,text); return true; } catch { return false; }
}
export function chartPath(samples, field, width=300, height=70, maximum=1) {
  const first=samples[0]?.wallMs ?? 0,last=samples.at(-1)?.wallMs ?? first;
  let connected=false,path='';
  for(const s of samples) {
    const v=finite(s[field]); if(v===null){connected=false;continue;}
    const x=(s.wallMs-first)/Math.max(1,last-first)*width,y=height-Math.min(1,v/Math.max(1,maximum))*height;
    path+=`${connected?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;connected=true;
  }
  return path.trim();
}
