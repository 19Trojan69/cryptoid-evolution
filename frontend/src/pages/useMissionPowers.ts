import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { axiosClient } from "../lib/axiosClient";
import { isSingleUseMissionPower, type MissionPower, type MissionPowerActivation, type MissionPowerInventory } from "../../../backend/src/missionPower";

type Attempt = { power: MissionPower; waiting: boolean };

export function useMissionPowers() {
  const [inventory, setInventory] = useState<MissionPowerInventory>();
  const [attempt, setAttempt] = useState<Attempt>();
  const run = useRef<string | null>(null);
  const inventoryRef = useRef<MissionPowerInventory | undefined>(undefined);
  const request = useRef<MissionPowerActivation | undefined>(undefined);
  const busy = useRef(false);
  const generation = useRef(0);
  const appliedId = useRef<string | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const receive = useCallback((data: MissionPowerInventory) => {
    const current = {
      stock: data.stock,
      pending: data.pending?.id === appliedId.current ? null : data.pending,
      used: [...new Set([...data.used, ...(inventoryRef.current?.used ?? [])])],
    };
    inventoryRef.current = current;
    setInventory(current);
    return current;
  }, []);

  const refresh = useCallback(async () => {
    const runId = run.current;
    if (!runId) return;
    const version = ++generation.current;
    const { data } = await axiosClient.get<MissionPowerInventory>("/hangar/power", { params: { runId }, timeout: 8_000 });
    if (mounted.current && run.current === runId && generation.current === version) receive(data);
  }, [receive]);

  const openRun = useCallback((runId: string | null) => {
    if (run.current === runId) return;
    run.current = runId;
    generation.current++;
    inventoryRef.current = undefined;
    request.current = undefined;
    appliedId.current = undefined;
    busy.current = false;
    setInventory(undefined);
    setAttempt(undefined);
    if (runId) void refresh().catch(() => {});
  }, [refresh]);

  const claim = useCallback(async (power: MissionPower) => {
    const runId = run.current;
    const inventory = inventoryRef.current;
    if (!runId || !inventory || busy.current) return;
    if (inventory.pending) return inventory.pending.power === power ? inventory.pending : undefined;
    if (!inventory.stock[power] || request.current && request.current.power !== power) return;
    const activation = request.current ?? { id: crypto.randomUUID(), power };
    request.current = activation;
    busy.current = true;
    setAttempt({ power, waiting: true });
    const currentRun = () => mounted.current && run.current === runId && request.current === activation;
    try {
      const { data } = await axiosClient.post<MissionPowerInventory>("/hangar/power/activate",
        { runId, power, requestId: activation.id }, { timeout: 8_000 });
      if (!currentRun()) return;
      generation.current++;
      const next = receive(data);
      if (data.pending && data.pending.id === appliedId.current) {
        // Another charge is available once the previous effect has been saved.
        setAttempt({ power, waiting: false });
        return;
      }
      request.current = undefined;
      setAttempt(undefined);
      return next.pending?.power === power ? next.pending : undefined;
    } catch (error) {
      if (!currentRun()) return;
      const code = isAxiosError(error) ? error.response?.data?.error : undefined;
      if (["power_stock_empty", "power_already_used", "run_replaced"].includes(code)) {
        request.current = undefined;
        setAttempt(undefined);
        void refresh().catch(() => {});
      } else {
        // A timed-out request may already have reserved the charge.
        setAttempt({ power, waiting: false });
      }
    } finally {
      if (run.current === runId) busy.current = false;
    }
  }, [receive, refresh]);

  const applyClaim = useCallback((activation: MissionPowerActivation, effect: () => void) => {
    const current = inventoryRef.current;
    if (current?.pending?.id !== activation.id || appliedId.current === activation.id) return false;
    effect();
    appliedId.current = activation.id;
    generation.current++;
    receive({ ...current, pending: null, used: isSingleUseMissionPower(activation.power)
      ? [...current.used, activation.power] : current.used });
    request.current = undefined;
    setAttempt(undefined);
    return true;
  }, [receive]);

  return { inventory, attempt, appliedId, claim, applyClaim, openRun, refresh };
}
