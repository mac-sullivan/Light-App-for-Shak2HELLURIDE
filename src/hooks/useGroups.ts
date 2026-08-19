import { useEffect, useState } from 'react';
import { loadGroups, saveGroups, type Group } from '../storage';

/** Named strip groups (zones), persisted to AsyncStorage. Seeded with defaults. */
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups().then(setGroups);
  }, []);

  const persist = (next: Group[]) => {
    setGroups(next);
    void saveGroups(next);
  };

  /** Save the given strip names as a group. Same name overwrites (edit). */
  const saveGroup = (name: string, members: string[]) => {
    const trimmed = name.trim();
    if (!trimmed || members.length === 0) return;
    const idx = groups.findIndex((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    const group: Group = {
      id: idx >= 0 ? groups[idx]!.id : `${Date.now()}`,
      name: trimmed,
      members: [...members],
    };
    persist(idx >= 0 ? groups.map((g, i) => (i === idx ? group : g)) : [...groups, group]);
  };

  const deleteGroup = (id: string) => {
    persist(groups.filter((g) => g.id !== id));
  };

  return { groups, saveGroup, deleteGroup };
}
