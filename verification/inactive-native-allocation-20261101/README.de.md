# Native Allokatoren nur an inaktiven Grenzen – 1. November 2026

Direkte Fortsetzung des isolierten Mini-Start-Vergleichs `0725adda`:
zwei Original-Läufe mit 809/923 MiB gegenüber zwei Guard-Läufen mit 1009/877 MiB
letztem Minutenmedian. Der Guard liefert keine nachgewiesene Speicherkorrektur.
Alle bestehenden Spielfunktionen bleiben erhalten. Vollständige Belege und die
vier Verläufe stehen in `../isolated-mini-pacing-20261101/`.

Die vorhandenen 90-Sekunden-Allokatorbelege und ihr korrigierter Parser bleiben
Grundlage dieser Fortsetzung. Die neue Erfassung startet erst **nach** 60 bzw.
1200 tatsächlich beobachteten aktiven Sekunden und nach bestätigter manueller
Pause. Originalgrafik, ursprüngliches Pacing und vorhandene Spielszene bleiben
erhalten. Keine API-Wrapper, aktive Traces, Heap-Snapshots, erzwungene GC oder
zusätzlichen Animationsscans während des aktiven Spiels.

Vier explizite globale Dumps werden sequenziell angefordert: pausiert nach
fünf Sekunden Ruhe vor angeforderter GC, pausiert nach GC, Home nach GC und
leeres neues Dokument nach GC. Vor und nach jeder Anforderung wird der echte
inaktive Zustand erneut geprüft. Die Anforderung verwendet `deterministic:false`,
damit nicht schon diese Option eine GC erzwingt; die normalen Browser- und
Diagnoseeffekte bleiben möglich. Linux-PSS wird unmittelbar vor und nach dem
Dump getrennt gespeichert. Der Dump selbst kann die Messung beeinflussen.
Siehe [CDP Tracing.requestMemoryDump](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/#method-requestMemoryDump).

Nur `disabled-by-default-memory-infra` ist eingeschlossen, Default-Kategorien
sind ausgeschlossen, automatische Dump-Trigger leer. Der Trace startet vollständig
nach der aktiven Strecke; ein aktiver 90-Sekunden-Profiler wird nicht als neue
unbeeinflusste Langmessung wiederholt. Das vollständige gefilterte synthetische
Trace-JSON wird komprimiert mit Digest auch vor der abschließenden Zuordnung
gesichert. Die bisherigen GUID-/Export-ID-Korrekturen und exakten oversized
unsigned-Hex-Werte werden wiederverwendet. Fehlende Kategorien bleiben null.
Eltern-/Kind-Allokatoren, Aliaswerte und Prozessfragmente dürfen nicht zu einem
angeblichen RAM-/GPU-Gesamtwert summiert werden.

Vier neue Collector-Regressionen prüfen die wirklichen Aufrufgrenzen,
unveränderte Parameter, einen großen irrelevanten Event-Burst, ungeeignete aktive
Zustände, verlorene Daten, fehlende Renderer-Werte, fehlgeschlagene Dumps und
vollständige Session-/Listenerfreigabe. Sieben bestehende Parserfälle werden
beibehalten. Erst wenn der reale 60-Sekunden-Ablauf alle vier Dumps liefert,
beginnt der separate 20-Minuten-Lauf. Fehler bleiben Fehler und werden gesichert.

Diese Phase verändert keinen Spielcode und veröffentlicht keine neue Spielversion.
Native Allokatorwerte aus Linux identifizieren noch keine physische iOS-/Android-
Ursache. Ergebnisse werden nach tatsächlicher Prüfung ergänzt.
