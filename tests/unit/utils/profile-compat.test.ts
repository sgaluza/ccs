import { describe, expect, it } from 'bun:test';
import { getProfileLookupCandidates, isLegacyProfileAlias } from '../../../src/utils/profile-compat';

describe('profile-compat', () => {
  describe('getProfileLookupCandidates', () => {
    it('returns km candidates with legacy kimi fallback', () => {
      expect(getProfileLookupCandidates('km')).toEqual(['km', 'kimi']);
    });

    it('keeps non-aliased profiles unchanged', () => {
      expect(getProfileLookupCandidates('glm')).toEqual(['glm']);
    });

    it('normalizes uppercase input and still resolves aliases', () => {
      expect(getProfileLookupCandidates('KM')).toEqual(['KM', 'km', 'kimi']);
    });
  });

  describe('isLegacyProfileAlias', () => {
    it('returns true for km -> kimi', () => {
      expect(isLegacyProfileAlias('km', 'kimi')).toBe(true);
    });

    it('returns false for canonical names', () => {
      expect(isLegacyProfileAlias('km', 'km')).toBe(false);
      expect(isLegacyProfileAlias('glm', 'glm')).toBe(false);
    });

    it('returns false for unrelated names', () => {
      expect(isLegacyProfileAlias('glm', 'kimi')).toBe(false);
    });
  });
});
