import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { toStarlightSidebar } from './src/nav.mjs';

// GA4 measurement ID — public by nature (it ships in every page's HTML).
// Empty string disables all analytics script injection.
const GA_ID = 'G-KSEZLN4P22'; // ClusterCode web stream (analytics.google.com)

// TWIN of packages/ui/src/utils/cookie-consent.ts in clustercodehq/core
// (`CONSENT_OPT_IN_REGIONS` + `consentModeInitScript`). The two share the
// `cc_consent` cookie on `.clustercode.io`, so they MUST stay in sync — a
// visitor who opts out on clustercode.io must not be measured on docs.
//
// Regions where analytics requires PRIOR opt-in (GDPR/ePrivacy): EU-27, EEA
// non-EU, UK, CH, plus EU territories that carry their own alpha-2 code and
// are therefore NOT covered by their parent member state's entry.
const CONSENT_OPT_IN_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB', 'CH',
  'AX', 'GF', 'GP', 'MQ', 'RE', 'YT', 'MF',
  'GI',
  'JE', 'GG', 'IM',
];

const consentInitScript = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
window.gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  region: ${JSON.stringify(CONSENT_OPT_IN_REGIONS)}
});
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )cc_consent=([^;]*)/);
    if (!m) return;
    var rec = JSON.parse(decodeURIComponent(m[1]));
    var c = rec && rec.categories;
    if (!c || c.necessary !== true || typeof c.functional !== 'boolean' || typeof c.analytics !== 'boolean') return;
    if (typeof rec.timestamp !== 'number') return;
    // A recorded REFUSAL never expires: with a 'granted' default, letting a
    // stale rejection lapse would silently resume tracking someone who said
    // no. A recorded GRANT still expires after 365d and must be re-affirmed.
    if (c.analytics === false) {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
      return;
    }
    if (Date.now() - rec.timestamp > 365 * 864e5) return;
    if (rec.timestamp - Date.now() > 3e5) return; // reject future stamps (5-min skew allowance)
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
  } catch (e) {}
})();
`;

export default defineConfig({
  site: 'https://docs.clustercode.io',
  integrations: [
    starlight({
      title: 'ClusterCode Docs',
      // Rewrites the generated <title> tag to the brand-first
      // "ClusterCode Docs · Page" order (+ a "[LOCAL Docs] " dev prefix),
      // matching the other ClusterCode apps. See src/routeData.ts.
      routeMiddleware: './src/routeData.ts',
      favicon: '/favicon.ico',
      logo: {
        dark: './src/assets/logo-dark.png',
        light: './src/assets/logo-light.png',
        replacesTitle: true,
      },
      components: {
        Header: './src/components/Header.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        PageFrame: './src/components/PageFrame.astro',
        Sidebar: './src/components/Sidebar.astro',
        MobileMenuFooter: './src/components/MobileMenuFooter.astro',
        MobileMenuToggle: './src/components/MobileMenuToggle.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/orgs/clustercodehq' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/M6d7yPz4GJ' },
        { icon: 'x.com', label: 'X', href: 'https://x.com/theclustercode' },
      ],
      // Site-wide branded social link-preview image (same card used by the
      // portal + orchestrator). Applies to every page — deep links keep their
      // own Starlight-derived og:title/og:description; only the image is
      // forced consistent here. The docs home page additionally overrides
      // og:title/og:description via its own frontmatter `head` (see
      // src/content/docs/index.mdx) so it shows the fixed share message.
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://docs.clustercode.io/og-card.png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://docs.clustercode.io/og-card.png' },
        },
        // Consent Mode v2 defaults + gtag.js loader. The consent-default script
        // MUST stay before the googletagmanager.com loader below so gtag() has
        // already been shimmed with denied defaults by the time GA's script
        // runs. Empty GA_ID (see top of file) disables injection entirely.
        ...(GA_ID
          ? [
              { tag: 'script', content: consentInitScript },
              {
                tag: 'script',
                attrs: { src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, async: true },
              },
              {
                tag: 'script',
                content: `window.gtag('js', new Date()); window.gtag('config', '${GA_ID}');`,
              },
            ]
          : []),
      ],
      // nav-icons.generated.css is emitted from NAV_ICONS by
      // scripts/generate-nav-icons.mjs and loads after custom.css.
      customCss: ['./src/styles/custom.css', './src/styles/nav-icons.generated.css'],
      // Nav lives in src/nav.mjs — the same tree drives the header, the mobile
      // menu and the Ctrl+K palette. Add pages there, not here.
      sidebar: toStarlightSidebar(),
    }),
  ],
});
