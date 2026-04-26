import { describe, expect, it } from 'vitest';
import { AiProfiles } from './AiProfiles';
import { SCORE_DIMENSIONS } from './ScoreWeights';

describe('AiProfiles', () => {
  it('every profile has required fields (id, description, weights)', () => {
    for (const [key, profile] of Object.entries(AiProfiles)) {
      expect(profile, `Profile "${key}" should be defined`).toBeDefined();
      expect(profile.id, `Profile "${key}" should have an id`).toBeTruthy();
      expect(typeof profile.id, `Profile "${key}" id should be a string`).toBe('string');
      expect(profile.description, `Profile "${key}" should have a description`).toBeTruthy();
      expect(typeof profile.description, `Profile "${key}" description should be a string`).toBe('string');
      expect(profile.weights, `Profile "${key}" should have weights`).toBeDefined();
      expect(typeof profile.weights, `Profile "${key}" weights should be an object`).toBe('object');
    }
  });

  it('every profile contains all SCORE_DIMENSIONS in weights', () => {
    for (const [key, profile] of Object.entries(AiProfiles)) {
      for (const dimension of SCORE_DIMENSIONS) {
        expect(
          dimension in profile.weights,
          `Profile "${key}" should have weight for dimension "${dimension}"`
        ).toBe(true);
      }
    }
  });

  it('no profile has negative weights', () => {
    for (const [key, profile] of Object.entries(AiProfiles)) {
      for (const [dimension, weight] of Object.entries(profile.weights)) {
        expect(
          weight,
          `Profile "${key}" dimension "${dimension}" should not be negative`
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('profile ids match their object keys', () => {
    for (const [key, profile] of Object.entries(AiProfiles)) {
      expect(profile.id, `Profile key "${key}" should match profile.id`).toBe(key);
    }
  });

  it('all weights are numeric', () => {
    for (const [key, profile] of Object.entries(AiProfiles)) {
      for (const [dimension, weight] of Object.entries(profile.weights)) {
        expect(
          typeof weight,
          `Profile "${key}" dimension "${dimension}" should be a number`
        ).toBe('number');
      }
    }
  });
});
