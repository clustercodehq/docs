/**
 * Which features carry a Beta treatment on the docs site.
 *
 * The treatment is three things: the "Beta" chip beside a page's nav entry
 * (`nav.mjs`), the `<BetaAside>` notice at the top of its page, and the inline
 * `<BetaTag>` in reference prose.
 *
 * `PUBLIC_BETA_FEATURES` is a comma-separated list. Unset — the product
 * default — means every feature in {@link ALL_BETA_FEATURES}. An empty string,
 * or the literal `none`, suppresses the treatment site-wide; that is what the
 * screenshot rig sets so the captured docs carry no Beta chips while the
 * published docs keep them. The orchestrator and portal read the same list from
 * `NEXT_PUBLIC_BETA_FEATURES`, so one setting poses all three surfaces alike.
 *
 * Plain `.mjs` (not `.ts`) for the same reason as `nav.mjs`: `astro.config.mjs`
 * imports the nav, which imports this.
 */

/** @typedef {'loops' | 'prototypes' | 'workflows'} BetaFeature */

/** Every feature that is in beta when nothing overrides the flag. */
export const ALL_BETA_FEATURES = ['loops', 'prototypes', 'workflows'];

const BETA_FEATURES = parseBetaFeatures(process.env.PUBLIC_BETA_FEATURES);

function parseBetaFeatures(raw) {
  if (raw === undefined) return new Set(ALL_BETA_FEATURES);
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0 && entry !== 'none'),
  );
}

/**
 * True when `feature` should show its Beta chip and notices.
 * @param {BetaFeature} feature
 */
export function isBetaFeature(feature) {
  return BETA_FEATURES.has(feature);
}

/**
 * The sidebar chip for a beta page, or `undefined` when the treatment is off —
 * `nav.mjs` already omits the key for a falsy badge.
 * @param {BetaFeature} feature
 */
export function betaBadge(feature) {
  return isBetaFeature(feature)
    ? { text: 'Beta', variant: 'default', class: 'beta-badge' }
    : undefined;
}
