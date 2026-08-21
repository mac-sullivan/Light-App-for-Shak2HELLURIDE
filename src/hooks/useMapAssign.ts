import { useEffect, useState } from 'react';
import { loadMapAssign, saveMapAssign } from '../storage';

/** Persisted map slot -> device name assignments (so the map works by position). */
export function useMapAssign() {
  const [assign, setAssign] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMapAssign().then(setAssign);
  }, []);

  const setSlot = (slot: string, deviceName: string | null) => {
    setAssign((prev) => {
      const next = { ...prev };
      if (deviceName) next[slot] = deviceName;
      else delete next[slot];
      void saveMapAssign(next);
      return next;
    });
  };

  return { assign, setSlot };
}
