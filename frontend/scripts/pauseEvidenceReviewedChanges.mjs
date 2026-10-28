import assert from 'node:assert/strict';
// Exact pause-evidence hunks only. Every original state assignment is retained.
export const pauseEvidenceChanges = [
  {
    "before": "import { bindGameInput } from './gameInput';",
    "after": "import { bindGameInput } from './gameInput';\nimport { recordPauseEvidence } from './pauseDiagnostics';"
  },
  {
    "before": "    setRewardCards([...rewardCardsRef.current]);\n    stateRef.current.status='paused'; clearControls();",
    "after": "    setRewardCards([...rewardCardsRef.current]);\n    if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'reward-cards', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current);\n    stateRef.current.status='paused'; clearControls();"
  },
  {
    "before": "      if (state.status === 'playing') {\n        state.status = 'paused';",
    "after": "      if (state.status === 'playing') {\n        if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, reason, { status: state.status, sector: state.sector, phase: state.phase, encounter: state.encounter }, lastFrameRef.current);\n        state.status = 'paused';"
  },
  {
    "before": "    bossSummaryRef.current = { summary, accepted: false, restored };\n    state.status = 'paused'; clearControls();",
    "after": "    bossSummaryRef.current = { summary, accepted: false, restored };\n    if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'boss-summary', { status: state.status, sector: state.sector, phase: state.phase, encounter: state.encounter }, lastFrameRef.current);\n    state.status = 'paused'; clearControls();"
  },
  {
    "before": "      if (stateRef.current.status !== 'playing') return;\n      stateRef.current.status = 'paused';",
    "after": "      if (stateRef.current.status !== 'playing') return;\n      if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'blur', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current);\n      stateRef.current.status = 'paused';"
  },
  {
    "before": "        if (stateRef.current.status === 'playing') {\n          stateRef.current.status = 'paused';",
    "after": "        if (stateRef.current.status === 'playing') {\n          if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'visibility-hidden', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current);\n          stateRef.current.status = 'paused';"
  },
  {
    "before": "      if (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000 && stateRef.current.status === \"playing\") {\n        stateRef.current.status = \"paused\"; clearControls();",
    "after": "      if (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000 && stateRef.current.status === \"playing\") {\n        if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'background-return', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current);\n        stateRef.current.status = \"paused\"; clearControls();"
  },
  {
    "before": "    if (stateRef.current.status !== 'playing' && stateRef.current.status !== 'paused') return;\n    stateRef.current.status = 'paused';",
    "after": "    if (stateRef.current.status !== 'playing' && stateRef.current.status !== 'paused') return;\n    if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'weapon-menu', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current);\n    stateRef.current.status = 'paused';"
  },
  {
    "before": "homePromptWasPlayingRef.current = stateRef.current.status === \"playing\"; stateRef.current.status = \"paused\";",
    "after": "homePromptWasPlayingRef.current = stateRef.current.status === \"playing\"; if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'home-menu', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current); stateRef.current.status = \"paused\";"
  },
  {
    "before": "if (game.status === \"paused\") { resumeWeaponSelection(); return; } stateRef.current.status = \"paused\";",
    "after": "if (game.status === \"paused\") { resumeWeaponSelection(); return; } if (ownerDiagnostics) recordPauseEvidence(ownerDiagnostics, 'manual-pause', { status: stateRef.current.status, sector: stateRef.current.sector, phase: stateRef.current.phase, encounter: stateRef.current.encounter }, lastFrameRef.current); stateRef.current.status = \"paused\";"
  },
  {
    "before": "window.removeEventListener(\"focus\", resumeAudio); };\n  }, [clearControls]);",
    "after": "window.removeEventListener(\"focus\", resumeAudio); };\n  }, [clearControls, ownerDiagnostics]);"
  },
  {
    "before": "    setGame({...stateRef.current});\n  }, [clearControls, ownerDiagnostics]);",
    "after": "    setGame({...stateRef.current});\n  }, [clearControls, ownerDiagnostics, setGame]);"
  }
];
export function restorePauseEvidenceChanges(source) {
  if (!source.includes("import { recordPauseEvidence } from './pauseDiagnostics';")) {
    assert.ok(!source.includes('recordPauseEvidence('), 'Partial pause evidence instrumentation');
    return source;
  }
  for (const {before, after} of [...pauseEvidenceChanges].reverse()) {
    assert.equal(source.split(after).length, 2, 'one exact pause evidence addition');
    source = source.replace(after, before);
  }
  return source;
}
