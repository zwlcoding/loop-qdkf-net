export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  effect: string;
}

export interface MetaProgressData {
  shards: number;
  totalRuns: number;
  bestLayer: number;
  unlockedModules: string[];
  unlockedChassis: string[];
  upgrades: MetaUpgrade[];
}

const STORAGE_KEY = "rift-meta-progress";

const DEFAULT_UPGRADES: Omit<MetaUpgrade, "purchased">[] = [
  {
    id: "extra_hp",
    name: "Extra HP",
    description: "+1 starting HP per squad member",
    cost: 50,
    effect: "+1 HP",
  },
  {
    id: "extra_gold",
    name: "Extra Gold",
    description: "+20% starting gold",
    cost: 75,
    effect: "+20% gold",
  },
  {
    id: "rare_chance",
    name: "Rare Chance",
    description: "+5% rare module drop rate",
    cost: 100,
    effect: "+5% rare drop",
  },
  {
    id: "extra_module",
    name: "Extra Module Slot",
    description: "+1 inventory slot",
    cost: 120,
    effect: "+1 slot",
  },
  {
    id: "unlock_elite",
    name: "Unlock Elite Rooms",
    description: "Unlock elite rooms in rift map",
    cost: 150,
    effect: "elite rooms",
  },
  {
    id: "stat_boost",
    name: "Stat Boost",
    description: "+10% all unit stats",
    cost: 200,
    effect: "+10% stats",
  },
];

function createDefaultData(): MetaProgressData {
  return {
    shards: 0,
    totalRuns: 0,
    bestLayer: 0,
    unlockedModules: [],
    unlockedChassis: [],
    upgrades: DEFAULT_UPGRADES.map((u) => ({ ...u, purchased: false })),
  };
}

export function loadMetaProgress(): MetaProgressData {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as Partial<MetaProgressData>;

    const upgrades: MetaUpgrade[] = DEFAULT_UPGRADES.map((def) => {
      const found = parsed.upgrades?.find((u) => u.id === def.id);
      return { ...def, purchased: found?.purchased ?? false };
    });

    return {
      shards: typeof parsed.shards === "number" ? parsed.shards : 0,
      totalRuns: typeof parsed.totalRuns === "number" ? parsed.totalRuns : 0,
      bestLayer: typeof parsed.bestLayer === "number" ? parsed.bestLayer : 0,
      unlockedModules: Array.isArray(parsed.unlockedModules)
        ? parsed.unlockedModules.filter((s): s is string => typeof s === "string")
        : [],
      unlockedChassis: Array.isArray(parsed.unlockedChassis)
        ? parsed.unlockedChassis.filter((s): s is string => typeof s === "string")
        : [],
      upgrades,
    };
  } catch {
    return createDefaultData();
  }
}

export function saveMetaProgress(data: MetaProgressData): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore serialization or storage errors
  }
}

export function addShards(data: MetaProgressData, amount: number): MetaProgressData {
  return { ...data, shards: data.shards + amount };
}

export function purchaseUpgrade(
  data: MetaProgressData,
  upgradeId: string
): MetaProgressData | null {
  const upgrade = data.upgrades.find((u) => u.id === upgradeId);
  if (!upgrade || upgrade.purchased || data.shards < upgrade.cost) {
    return null;
  }
  const nextUpgrades = data.upgrades.map((u) =>
    u.id === upgradeId ? { ...u, purchased: true } : u
  );
  return {
    ...data,
    shards: data.shards - upgrade.cost,
    upgrades: nextUpgrades,
  };
}

export function getAvailableUpgrades(): Omit<MetaUpgrade, "purchased">[] {
  return DEFAULT_UPGRADES.map(({ id, name, description, cost, effect }) => ({
    id,
    name,
    description,
    cost,
    effect,
  }));
}
