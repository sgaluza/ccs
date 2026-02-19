import { describe, expect, it } from 'bun:test';
import { getPresetById, isValidPresetId } from '../../../src/api/services/provider-presets';

describe('provider-presets', () => {
  it('resolves canonical km preset id', () => {
    const preset = getPresetById('km');
    expect(preset?.id).toBe('km');
  });

  it('resolves legacy kimi preset alias to km', () => {
    const preset = getPresetById('kimi');
    expect(preset?.id).toBe('km');
  });

  it('treats legacy kimi alias as a valid preset id', () => {
    expect(isValidPresetId('kimi')).toBe(true);
  });
});
