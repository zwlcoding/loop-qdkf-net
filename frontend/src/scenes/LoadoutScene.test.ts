import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock phaser to avoid `window is not defined` in node test environment
vi.mock("phaser", () => {
  return {
    Scene: class Scene {
      scene = { key: "" };
      constructor(config?: { key?: string }) {
        if (config?.key) {
          this.scene.key = config.key;
        }
      }
    },
  };
});

// Dynamic import after mock is established
const loadLoadoutScene = async () => {
  const module = await import("./LoadoutScene");
  return module.default;
};

describe("LoadoutScene", () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    } as unknown as Storage;
  });

  it("class exists and is a function", async () => {
    const LoadoutScene = await loadLoadoutScene();
    expect(LoadoutScene).toBeDefined();
    expect(typeof LoadoutScene).toBe("function");
  });

  it('has scene key "Loadout"', async () => {
    const LoadoutScene = await loadLoadoutScene();
    const scene = new LoadoutScene();
    expect(scene.scene.key).toBe("Loadout");
  });

  it("constructs without error", async () => {
    const LoadoutScene = await loadLoadoutScene();
    expect(() => new LoadoutScene()).not.toThrow();
  });
});
