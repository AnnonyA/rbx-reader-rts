// src/extractors/AnimSound.ts
export interface AssetInfo {
  id: number;
  className: string;
  animationId?: string;
  soundId?: string;
}

/**
 * Extrae AnimationId y SoundId de instancias parseadas.
 * ID numérico, sin duplicados.
 */
export function extractAnimsAndSounds(instances: {
  id: number;
  className: string;
  properties: Record<string, any>;
}[]): AssetInfo[] {
  const seen = new Set<string>();
  const results: AssetInfo[] = [];

  for (const inst of instances) {
    let raw: string | undefined;

    if (inst.className === 'Animation') {
      raw = inst.properties.AnimationId;
    } else if (inst.className === 'Sound') {
      raw = inst.properties.SoundId;
    }

    if (!raw || typeof raw !== 'string') continue;

    const match = raw.match(/(\d+)/);
    if (!match) continue;

    const numeric = match[1];
    const key = `${inst.className}-${numeric}`;
    if (seen.has(key)) continue;

    seen.add(key);
    const info: AssetInfo = {
      id: inst.id,
      className: inst.className
    };

    if (inst.className === 'Animation') {
      info.animationId = numeric;
    }
    if (inst.className === 'Sound') {
      info.soundId = numeric;
    }

    results.push(info);
  }

  return results;
}
