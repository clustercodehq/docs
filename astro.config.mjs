import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

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
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          collapsed: true,
          // Ordered so a reader going top-to-bottom never hits a page whose
          // prerequisites come later. Quickstart used to sit at position 2 while
          // depending on Install CLI + Register a Worker below it (and
          // register-worker linked back up to Quickstart) — a loop. Quickstart is
          // now the payoff at the end. 'Agent sign-in' moved here from Guides
          // (was 13 items deep, linked from no Getting Started page) because a
          // worker without signed-in agents cannot do agent work at all.
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Install CLI', slug: 'getting-started/install-cli' },
            { label: 'Register a Worker', slug: 'getting-started/register-worker' },
            { label: 'Agent sign-in', slug: 'guides/agent-sign-in' },
            { label: 'Your first DevBox', slug: 'getting-started/quickstart' },
          ],
        },
        {
          label: 'Concepts',
          collapsed: true,
          items: [
            { label: 'Workers', slug: 'concepts/workers' },
            { label: 'Cloud workers', slug: 'concepts/cloud-workers' },
            { label: 'DevBoxes', slug: 'concepts/containers' },
            { label: 'Windows Containers', slug: 'concepts/windows-containers' },
            { label: 'Projects', slug: 'concepts/projects' },
            { label: 'Nucleus', slug: 'concepts/nucleus' },
            { label: 'Observatory', slug: 'concepts/observatory' },
            { label: 'Tickets', slug: 'concepts/tickets' },
            { label: 'Runtime Catalog', slug: 'concepts/runtime-catalog' },
            { label: 'Bring Your Own Subscription', slug: 'concepts/byo-subscription' },
            { label: 'Settings', slug: 'concepts/settings' },
            { label: 'Session persistence', slug: 'concepts/session-persistence' },
            { label: 'Security Profiles', slug: 'concepts/security-profiles' },
          ],
        },
        {
          // Top-level (not nested under Concepts) and expanded by default so the
          // Schedules/Runs guides + the timeline showcase are discoverable at a
          // glance — they were getting lost two levels deep.
          label: 'Automation',
          collapsed: false,
          items: [
            { label: 'Overview', slug: 'concepts/automation' },
            { label: 'Nova', slug: 'concepts/nova' },
            { label: 'Schedules', slug: 'concepts/schedules' },
            { label: 'Runs', slug: 'concepts/runs' },
            { label: 'Loops', slug: 'concepts/loops', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'How a Loop run works', slug: 'concepts/loop-run-lifecycle', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'Prototyping', slug: 'concepts/prototyping', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'How a Prototype race works', slug: 'concepts/prototype-race-lifecycle', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'Multi-Agent Runs', slug: 'guides/multi-agent-runs' },
            { label: 'Engines', slug: 'concepts/subagents' },
          ],
        },
        {
          label: 'Guides',
          collapsed: true,
          // The two ticket-entry paths sit adjacent at the top so the reader sees
          // the choice — delegated (Run) vs. hands-on (Launch) — rather than
          // discovering only the manual one and assuming it's the whole product.
          // 'Run an agent on demand' leads because it is the flow that actually
          // delivers the headline ticket → PR promise.
          items: [
            { label: 'Run an agent on demand', slug: 'guides/run-on-demand' },
            { label: 'Launch from Ticket', slug: 'guides/launch-from-ticket' },
            { label: 'Automate recurring work', slug: 'guides/recurring-work' },
            { label: 'Explore your fleet in the Observatory', slug: 'guides/explore-observatory' },
            { label: 'Create a Loop', slug: 'guides/create-a-loop', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'Create a Prototype', slug: 'guides/create-a-prototype', badge: { text: 'Beta', variant: 'default', class: 'beta-badge' } },
            { label: 'Custom Containerfile', slug: 'guides/custom-containerfile' },
            { label: 'Build from DevBox', slug: 'guides/build-image-from-container' },
            { label: 'Privileged Mode (Nested Containers)', slug: 'guides/privileged-nested-containers' },
            { label: 'Windows Golden Image', slug: 'guides/windows-golden-image' },
            { label: 'Visual Testing', slug: 'guides/visual-testing' },
            { label: 'Team Setup', slug: 'guides/team-setup' },
            // 'Agent sign-in' now lives in Getting Started (see above).
            { label: 'Cloud worker', slug: 'guides/cloud-worker' },
            { label: 'VS Code Extension', slug: 'guides/vscode-extension' },
            { label: 'AI Credits', slug: 'guides/ai-credits' },
          ],
        },
        {
          label: 'CLI Reference',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'cli/overview' },
            { label: 'login', slug: 'cli/login' },
            { label: 'worker', slug: 'cli/worker' },
            { label: 'doctor', slug: 'cli/doctor' },
            { label: 'onboard', slug: 'cli/onboard' },
            { label: 'config', slug: 'cli/config' },
            { label: 'status', slug: 'cli/status' },
          ],
        },
        {
          label: 'Self-Hosting',
          collapsed: true,
          items: [
            { label: 'Worker Agent', slug: 'self-hosting/worker-agent' },
            { label: 'Requirements', slug: 'self-hosting/requirements' },
            { label: 'Troubleshooting', slug: 'self-hosting/troubleshooting' },
          ],
        },
        {
          label: 'Reference',
          collapsed: true,
          items: [
            { label: 'Plans & Limits', slug: 'reference/plans-and-limits' },
            { label: 'Supported Agents', slug: 'reference/supported-agents' },
            { label: 'Environment Variables', slug: 'reference/environment-variables' },
            { label: 'Changelog', slug: 'reference/changelog' },
          ],
        },
        {
          label: 'Links',
          collapsed: true,
          items: [
            { label: 'Home', link: 'https://clustercode.io' },
            { label: 'Console', link: 'https://console.clustercode.io' },
            { label: 'Admin', link: 'https://clustercode.io/admin' },
          ],
        },
      ],
    }),
  ],
});
