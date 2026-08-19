import { useEffect, useState } from 'react';
import { lightManager } from '../ble/LightManager';
import { loadScenes, saveScenes, type Scene } from '../storage';

/** Saved whole-car looks, persisted to AsyncStorage. Used by the Scenes UI. */
export function useScenes() {
  const [scenes, setScenes] = useState<Scene[]>([]);

  useEffect(() => {
    loadScenes().then(setScenes);
  }, []);

  const persist = (next: Scene[]) => {
    setScenes(next);
    void saveScenes(next);
  };

  const saveCurrent = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const scene: Scene = {
      // Runtime app context: Date.now is available here (unlike workflow scripts).
      id: `${Date.now()}`,
      name: trimmed,
      states: lightManager.getLightStates(),
    };
    persist([...scenes, scene]);
  };

  const applyScene = (scene: Scene) => {
    void lightManager.applyStates(scene.states);
  };

  const deleteScene = (id: string) => {
    persist(scenes.filter((s) => s.id !== id));
  };

  return { scenes, saveCurrent, applyScene, deleteScene };
}
