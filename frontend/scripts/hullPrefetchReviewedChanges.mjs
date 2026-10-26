// Exact skip of redundant source warming; original readiness and pin ownership stay.
const changes = {
  "src/pages/paintedShip.ts": [
    {
      "before": "};\n\n// Ready images use the existing eight-source cache; pending URLs share one load.\nexport const preloadHullSources = (urls: readonly string[]) => {\n  for (const url of [...new Set(urls)].slice(0, 7)) void shipImage(url).catch(() => {});\n};\n\nexport const useHullSourceReady = (url: string | undefined) => {\n",
      "after": "};\n\n// Ready images use the existing eight-source cache; pending URLs share one load.\nexport const preloadHullSources = (urls: readonly string[], hulls: readonly PreparedHull[] = []) => {\n  // A prepared color/stage already supplies its visible hull and flame gate.\n  // Do not reload its raw original after completion cleanup evicted that LRU.\n  // Every planned variant sharing a source must be ready before skipping it.\n  const prepared = new Map<string, boolean>();\n  for (const hull of hulls) {\n    const stage = hull.stage ?? 1, url = shipEvolutionAsset(hull.sprite, stage);\n    const ready = Boolean(cache.get(`${hull.sprite}:${stage}:${hull.color}`));\n    prepared.set(url, (prepared.get(url) ?? true) && ready);\n  }\n  for (const url of [...new Set(urls)].slice(0, 7)) {\n    if (!prepared.get(url)) void shipImage(url).catch(() => {});\n  }\n};\n\nexport const useHullSourceReady = (url: string | undefined) => {\n"
    },
    {
      "before": "  const [readyUrl, setReadyUrl] = useState<string | null>(null);\n  useEffect(() => {\n    let active = true;",
      "after": "  const [readyUrl, setReadyUrl] = useState<string | null>(null);\n  useEffect(() => {\n    // The offset metadata outlives the evictable original Image. Re-entry only\n    // needs that known center; a new stage/source still uses the actual load.\n    if (visualCenters.has(url)) return;\n    let active = true;"
    }
  ],
  "src/pages/usePreparedGameHulls.ts": [
    {
      "before": "  const current = useRef<ReturnType<typeof retainPreparedHulls> | null>(null);\n  useEffect(() => {\n    sessionDiagnostic('boundary', { operation: 'hull-plan-start', sector, encounter });\n    preloadHullSources(hullSourcePlan(sector, encounter, offset, wave));\n    hullPreparationStep('plan-preloaded', { sector, encounter });\n    // Acquire the incoming plan before retiring the old one: both can contain\n    // the same prewarmed hulls. A temporary zero-pin gap would evict them.\n    hullPreparationStep('plan-retain-before', { sector, encounter });\n    const next = retainPreparedHulls(preparedHullPlan(sector, encounter, offset, wave, bonusGroup, rulesVersion));\n    hullPreparationStep('plan-retained', { sector, encounter });\n    const previous = current.current;\n    current.current = next;\n",
      "after": "  const current = useRef<ReturnType<typeof retainPreparedHulls> | null>(null);\n  useEffect(() => {\n    sessionDiagnostic('boundary', { operation: 'hull-plan-start', sector, encounter });\n    const plan = preparedHullPlan(sector, encounter, offset, wave, bonusGroup, rulesVersion);\n    preloadHullSources(hullSourcePlan(sector, encounter, offset, wave), plan);\n    hullPreparationStep('plan-preloaded', { sector, encounter });\n    // Acquire the incoming plan before retiring the old one: both can contain\n    // the same prewarmed hulls. A temporary zero-pin gap would evict them.\n    hullPreparationStep('plan-retain-before', { sector, encounter });\n    const next = retainPreparedHulls(plan);\n    hullPreparationStep('plan-retained', { sector, encounter });\n    const previous = current.current;\n    current.current = next;\n"
    }
  ]
};
export function restoreHullPrefetchChanges(source, path) {
  for (const {before, after} of [...(changes[path] ?? [])].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact hull prefetch change");
    source = source.replace(after, before);
  }
  return source;
}
