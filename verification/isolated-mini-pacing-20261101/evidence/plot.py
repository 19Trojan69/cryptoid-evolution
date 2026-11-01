"""Scientific figure from the four verified synthetic captures; no game assets."""
import gzip
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['workflowConclusion'] == 'success'
entries = sorted((entry for entry in manifest['captures'] if entry['cell']['seconds'] == 1200),
                 key=lambda entry: (entry['cell']['condition'] == 'bypass', entry['cell']['replica']))
assert len(entries) == 4
fig, (left, right) = plt.subplots(1, 2, figsize=(11.5, 5.2), dpi=120,
                                gridspec_kw={'width_ratios': [2.8, 1]}, layout='constrained')
colors = ['#313b45', '#82909d', '#1267b5', '#58a3d7']
peaks = []
for index, entry in enumerate(entries):
    capture = json.loads(gzip.decompress((root / entry['file']).read_bytes()))
    assert capture['sourceCommit'] == manifest['measuredSource'] and capture['complete'] is True
    cell = entry['cell']
    label = ('Kontrolle' if cell['condition'] == 'control' else 'Guard') + ' ' + str(cell['replica'])
    x = [point['activeMs'] / 60000 for point in capture['points']]
    y = [point['memory']['summedPssKiB'] / 1024 for point in capture['points']]
    left.plot(x, y, color=colors[index], label=label, linewidth=1.65,
              linestyle='-' if cell['replica'] == 1 else '--')
    before = next(point for point in capture['checkpoints'] if point['label'] == 'paused-settled-before-gc')['memory']['summedPssKiB'] / 1024
    after = next(point for point in capture['checkpoints'] if point['label'] == 'paused-after-gc')['memory']['summedPssKiB'] / 1024
    right.plot([index, index], [before, after], color=colors[index], alpha=.6)
    right.scatter([index], [before], marker='o', color=colors[index], label='vor GC' if index == 0 else None)
    right.scatter([index], [after], marker='v', color=colors[index], label='nach GC' if index == 0 else None)
    peaks.extend(y + [before, after])
left.set(xlabel='Gemessene aktive Spielzeit (Minuten)', ylabel='Linux-Browserprozess-PSS (MiB)',
         title='Aktive Strecke ohne API-Wrapper oder Heap-Profiler', xlim=(0, 20))
right.set(title='Bestätigte Pause', xticks=range(4),
          xticklabels=['K 1', 'K 2', 'G 1', 'G 2'], ylabel='PSS (MiB)')
for axis in (left, right):
    axis.set_ylim(0, max(peaks) * 1.08)
    axis.grid(axis='y', alpha=.2)
    axis.spines[['top', 'right']].set_visible(False)
    axis.legend(fontsize=8, frameon=False, loc='upper left')
fig.suptitle('Originalszene: isolierter Mini-Start-Pacing-Vergleich', fontsize=13)
fig.supxlabel('Vier unabhängige, unseeded Linux-Chromium-Läufe; keine physische Smartphone-Messung.', fontsize=8)
fig.savefig(root / 'process-memory.png')
plt.close(fig)
