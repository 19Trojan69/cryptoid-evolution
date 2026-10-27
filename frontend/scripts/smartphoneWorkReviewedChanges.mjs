// Exact idle-loop wiring; combat, effects, saves and pause rules stay intact.
const changes = [
  {
    "before": "  const projectilesRef = useRef<ReturnType<typeof createProjectilePresentation> | null>(null);",
    "after": "  const projectilesRef = useRef<ReturnType<typeof createProjectilePresentation> | null>(null);\n  const wakeGameLoopRef = useRef<(() => void) | null>(null);"
  },
  {
    "before": "  const [game, setGame] = useState<GameState>(createInitialState);",
    "after": "  const [game, setGame] = useState<GameState>(createInitialState);\n  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status]);"
  },
  {
    "before": "      active: () => stateRef.current.status === 'playing',",
    "after": "      active: () => stateRef.current.status === 'playing',\n      sleepWhenInactive: () => stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0,"
  },
  {
    "before": "      unwatch: id => window.clearInterval(id),\n    });\n    return () => {\n      stop();",
    "after": "      unwatch: id => window.clearInterval(id),\n    });\n    wakeGameLoopRef.current = stop.wake;\n    return () => {\n      if (wakeGameLoopRef.current === stop.wake) wakeGameLoopRef.current = null;\n      stop();"
  }
];
export function restoreSmartphoneWorkGameChanges(source) {
  for (const {before, after} of [...changes].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact smartphone work change");
    source = source.replace(after, before);
  }
  return source;
}
