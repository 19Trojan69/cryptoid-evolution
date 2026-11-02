from pathlib import Path
import gzip,json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path(__file__).parent
fig,(active,inactive)=plt.subplots(1,2,figsize=(13.5,5.4),gridspec_kw={'width_ratios':[1.75,1]})
colors={'control':'#225ea8','leaf':'#d96b13'}
for condition,label in [('control','Original'),('leaf','Flammen')]:
 for replica,style in [(1,'-'),(2,'--')]:
  capture=json.loads(gzip.decompress((root/f'{condition}-r{replica}-long.json.gz').read_bytes()))
  x=[row['activeMs']/60000 for row in capture['points']]
  y=[row['memory']['summedPssKiB']/1024 for row in capture['points']]
  active.plot(x,y,style,color=colors[condition],linewidth=1.6,label=f'{label} {replica}')
  native=capture['inactiveNativeAllocation']['checkpoints']
  values=[]
  for name in ['paused-settled-before-gc','paused-after-gc']:
   checkpoint=next(row for row in native if row['label']==name)
   fragments=[row for row in checkpoint['processes'] if 'renderer' in row['processName'].lower() and row['categories']['blink_gc'] is not None]
   assert len(fragments)==1
   values.append(fragments[0]['categories']['blink_gc']/1048576)
  inactive.plot([0,1],values,style,color=colors[condition],marker='o',linewidth=1.6,label=f'{label} {replica}')
active.set(xlabel='Aktive Spielzeit (Minuten)',ylabel='Prozess-PSS (MiB)',xlim=(0,20))
active.set_title('Vier unabhängige aktive Verläufe')
active.legend(frameon=False,ncol=2,fontsize=9)
inactive.set(xticks=[0,1],xticklabels=['Pause + Ruhezeit\nvor GC-Anforderung','Nach GC-\nAnforderung'],ylabel='Nativer Blink-Heap (MiB)')
inactive.set_title('Dumps nach Pause und vorheriger Ruhezeit')
for ax in [active,inactive]:
 ax.grid(alpha=.2)
 ax.spines[['top','right']].set_visible(False)
 ax.set_ylim(bottom=0)
fig.suptitle('Eine CSS-Variable: Boss-Wurzel oder bestehende Triebwerksflammen',fontsize=14,y=.98)
fig.text(.5,.025,'Linux Chromium · unseeded · angeforderte GC erst nach Pause · Dumps nach Ruhezeit · getrennte Messgrößen, keine Summen · kein Gerätetest',ha='center',fontsize=8.5)
fig.tight_layout(rect=[0,.06,1,.94])
fig.savefig(root/'process-memory.png',dpi=160,facecolor='white')
