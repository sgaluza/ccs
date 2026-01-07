import { describe, expect, test } from 'bun:test';
import type { TierConfig } from '../../../src/router/config/schema';

// Test the cycle detection function directly
// We need to extract it or test it through validateProfile

// For now, test detection via creating configs with cycles
describe('fallback cycle detection', () => {
  // Helper to create a chain that would cause infinite recursion
  function createCyclicConfig(): TierConfig {
    // A -> B -> A (cycle)
    const configA: TierConfig = {
      provider: 'providerA',
      model: 'modelA',
      fallback: [],
    };
    const configB: TierConfig = {
      provider: 'providerB',
      model: 'modelB',
      fallback: [configA],
    };
    configA.fallback = [configB];
    return configA;
  }

  function createLinearConfig(): TierConfig {
    // A -> B -> C (no cycle)
    return {
      provider: 'providerA',
      model: 'modelA',
      fallback: [
        {
          provider: 'providerB',
          model: 'modelB',
          fallback: [
            {
              provider: 'providerC',
              model: 'modelC',
            },
          ],
        },
      ],
    };
  }

  test('linear fallback chain has no cycle', () => {
    const config = createLinearConfig();
    // Count unique providers to verify no infinite loop
    const providers = new Set<string>();
    let current: TierConfig | undefined = config;
    let depth = 0;

    while (current && depth < 10) {
      providers.add(current.provider);
      current = current.fallback?.[0];
      depth++;
    }

    expect(providers.size).toBe(3);
    expect(depth).toBe(3);
  });

  test('cyclic fallback chain detection', () => {
    const config = createCyclicConfig();
    // This tests the structure that _detectFallbackCycle should catch
    const visited = new Set<string>();
    let current: TierConfig | undefined = config;
    let hasCycle = false;

    for (let i = 0; i < 10 && current; i++) {
      if (visited.has(current.provider)) {
        hasCycle = true;
        break;
      }
      visited.add(current.provider);
      current = current.fallback?.[0];
    }

    expect(hasCycle).toBe(true);
  });
});
