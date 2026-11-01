import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { analyzeReport, summarizeAnalyses } from './reportAnalysis.mjs';

const [directory, output] = process.argv.slice(2);
if (!directory || !output) throw Error('Usage: node analyzeLocalReports.mjs INPUT_DIRECTORY OUTPUT_JSON');
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(item => item.isDirectory()
    ? files(join(path, item.name)) : item.name.endsWith('.json') ? [join(path, item.name)] : []);
}
const unique = new Set(), reports = [];
let duplicates = 0, ignored = 0;
for (const file of files(resolve(directory)).sort()) {
  const bytes = readFileSync(file), digest = createHash('sha256').update(bytes).digest('hex');
  const report = JSON.parse(bytes);
  if (!['cryptoid-full-session-report', 'cryptoid-isolated-boss2-device-report'].includes(report.format)) { ignored++; continue; }
  if (unique.has(digest)) { duplicates++; continue; }
  unique.add(digest); reports.push({ reportSha256: digest, ...analyzeReport(report) });
}
const result = { version: 1, uniqueReports: reports.length, duplicateFiles: duplicates, ignoredFiles: ignored,
  rawReportsIncluded: false, ownerSymptomsNotInferredFromJson: true, ...summarizeAnalyses(reports) };
writeFileSync(resolve(output), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ uniqueReports: reports.length, duplicateFiles: duplicates, ignoredFiles: ignored,
  completeFullRecordings: reports.filter(row => row.fullRecordingPresent && row.recordIntegrityValid).length,
  abruptReturnSignals: reports.filter(row => row.abruptReturnSignal).length,
  longestCapturedSimulation: reports.filter(row => row.capturedSimulationMs !== null)
    .sort((a, b) => b.capturedSimulationMs - a.capturedSimulationMs).slice(0, 3)
    .map(row => ({ source: row.sourceCommit, capturedSimulationMs: row.capturedSimulationMs,
      recordedDocumentSpanMs: row.recordedDocumentSpanMs, maxima: row.sampledMaxima })) }));
