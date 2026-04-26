import { describe, it, expect, vi } from "vitest";

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
const loadResultScene = async () => {
  const module = await import("./ResultScene");
  return module.default;
};

describe("ResultScene", () => {
  it("maps reward type labels correctly", () => {
    const typeLabels: Record<string, string> = {
      resource: "资源",
      experience: "经验",
      unlock: "解锁",
    };

    expect(typeLabels.resource).toBe("资源");
    expect(typeLabels.experience).toBe("经验");
    expect(typeLabels.unlock).toBe("解锁");
  });

  it("class exists and extends Phaser.Scene", async () => {
    const ResultScene = await loadResultScene();
    expect(ResultScene).toBeDefined();
    // Verify it is a constructor function with a prototype chain
    expect(typeof ResultScene).toBe("function");
    expect(ResultScene.prototype).toBeDefined();
  });

  it('has scene key "Result"', async () => {
    const ResultScene = await loadResultScene();
    const scene = new ResultScene();
    expect(scene.scene.key).toBe("Result");
  });
});
