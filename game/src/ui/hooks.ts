import { useEffect, useState, useSyncExternalStore } from 'react';
import { store, GameState } from '../core/state';
import { bus } from '../core/bus';

export function useGame(): GameState {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store.state;
}
export function useBus<T>(ev: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(init);
  useEffect(() => bus.on(ev, (p) => setV(p)), [ev]);
  return [v, setV];
}
export const fmt = (n: number) => Math.floor(n).toLocaleString('vi-VN');
