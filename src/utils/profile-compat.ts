/**
 * Profile compatibility helpers for renamed commands/profiles.
 *
 * Current compatibility mappings:
 * - `km` is the canonical Kimi API profile command
 * - `kimi` remains as legacy API profile name in existing user configs
 */

const PROFILE_COMPAT_ALIASES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  km: ['kimi'],
});

/**
 * Build lookup candidates for a profile.
 * Order: exact input -> lowercase form (if different) -> legacy aliases.
 */
export function getProfileLookupCandidates(profileName: string): string[] {
  const raw = profileName.trim();
  const normalized = raw.toLowerCase();
  const aliases = PROFILE_COMPAT_ALIASES[normalized] || [];
  const ordered = [raw, normalized, ...aliases];

  return [...new Set(ordered.filter(Boolean))];
}

/**
 * Check whether a resolved profile name came from a legacy alias.
 */
export function isLegacyProfileAlias(requestedName: string, resolvedName: string): boolean {
  const requestedNormalized = requestedName.trim().toLowerCase();
  const resolvedNormalized = resolvedName.trim().toLowerCase();

  if (requestedNormalized === resolvedNormalized) {
    return false;
  }

  const aliases = PROFILE_COMPAT_ALIASES[requestedNormalized] || [];
  return aliases.includes(resolvedNormalized);
}
