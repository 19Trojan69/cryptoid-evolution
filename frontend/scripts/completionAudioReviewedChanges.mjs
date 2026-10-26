// Exact pending activation wait at the unified completion barrier.
export const reviewedCompletionAudioGameChanges = [
  {
    "before": "  const prepareBossSummary = useCallback(async (recover = false) => {\n    const pending = bossSummaryRef.current, runId = scoreRunRef.current;\n    if (!pending || pending.accepted) return;\n    const generation = ++bossPreparationRef.current;\n    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    setBossSummarySaving(true); setBossSummaryFailed(false); setBossSummaryPrepared(false);\n",
    "after": "  const prepareBossSummary = useCallback(async (recover = false) => {\n    const pending = bossSummaryRef.current, runId = scoreRunRef.current;\n    if (!pending || pending.accepted) return;\n    // Let the already running activation settle before checking its receipt.\n    // weaponBusy's existing React state wakes preparation when it finishes.\n    if (runId && !adminRunRef.current && weaponBusyRef.current) { setBossSummarySaving(true); return; }\n    const generation = ++bossPreparationRef.current;\n    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    setBossSummarySaving(true); setBossSummaryFailed(false); setBossSummaryPrepared(false);\n"
  },
  {
    "before": "    try {\n      if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'boss-summary-save-before', sector: pending.summary.stage });\n      if (runId && !adminRunRef.current) {\n        if (weaponBusyRef.current) throw Error('Activation confirmation still in progress');\n        if (recover) await saveQueueRef.current?.recover();\n        else await saveQueueRef.current?.drain();\n        if (!current()) return;\n",
    "after": "    try {\n      if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'boss-summary-save-before', sector: pending.summary.stage });\n      if (runId && !adminRunRef.current) {\n        if (recover) await saveQueueRef.current?.recover();\n        else await saveQueueRef.current?.drain();\n        if (!current()) return;\n"
  },
  {
    "before": "      }\n    } finally { if (current()) setBossSummarySaving(false); }\n  }, [hasLocalLevelBackup, ownerDiagnostics, ownerResourceContext]);\n  useEffect(() => { if (bossSummary) void prepareBossSummary(); }, [bossSummary, prepareBossSummary]);\n  const continueBossSummary = async (retry = false) => {\n    const pending = bossSummaryRef.current, runId = scoreRunRef.current;\n    if (!pending || pending.accepted || !bossSummaryPrepared || bossSummarySaving || (bossSummaryFailed && !retry) || bossSummaryContinuing) return;\n",
    "after": "      }\n    } finally { if (current()) setBossSummarySaving(false); }\n  }, [hasLocalLevelBackup, ownerDiagnostics, ownerResourceContext]);\n  useEffect(() => { if (bossSummary) void prepareBossSummary(); }, [bossSummary, weaponBusy, prepareBossSummary]);\n  const continueBossSummary = async (retry = false) => {\n    const pending = bossSummaryRef.current, runId = scoreRunRef.current;\n    if (!pending || pending.accepted || !bossSummaryPrepared || bossSummarySaving || (bossSummaryFailed && !retry) || bossSummaryContinuing) return;\n"
  }
];
export function restoreCompletionAudioGameChanges(source) {
  for (const {before, after} of [...reviewedCompletionAudioGameChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact completion activation change");
    source = source.replace(after, before);
  }
  return source;
}
