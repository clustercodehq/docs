import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.clustercode.io',
  integrations: [
    starlight({
      title: 'ClusterCode | Docs',
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
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/BRPt2DXM' },
        { icon: 'x.com', label: 'X', href: 'https://x.com/clustercode' },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          collapsed: true,
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Quickstart', slug: 'getting-started/quickstart' },
            { label: 'Install CLI', slug: 'getting-started/install-cli' },
            { label: 'Register a Worker', slug: 'getting-started/register-worker' },
          ],
        },
        {
          label: 'Concepts',
          collapsed: true,
          items: [
            { label: 'Workers', slug: 'concepts/workers' },
            { label: 'DevBoxes', slug: 'concepts/containers' },
            { label: 'Projects', slug: 'concepts/projects' },
            { label: 'Nucleus', slug: 'concepts/nucleus' },
            { label: 'Observatory', slug: 'concepts/observatory' },
            { label: 'Tickets', slug: 'concepts/tickets' },
            { label: 'Runtime Catalog', slug: 'concepts/runtime-catalog' },
            { label: 'Settings', slug: 'concepts/settings' },
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
            { label: 'Engines', slug: 'concepts/subagents' },
          ],
        },
        {
          label: 'Guides',
          collapsed: true,
          items: [
            { label: 'Launch from Ticket', slug: 'guides/launch-from-ticket' },
            { label: 'Explore your fleet in the Observatory', slug: 'guides/explore-observatory' },
            { label: 'Run an agent on demand', slug: 'guides/run-on-demand' },
            { label: 'Automate recurring work', slug: 'guides/recurring-work' },
            { label: 'Custom Containerfile', slug: 'guides/custom-containerfile' },
            { label: 'Build from DevBox', slug: 'guides/build-image-from-container' },
            { label: 'Windows Golden Image', slug: 'guides/windows-golden-image' },
            { label: 'Team Setup', slug: 'guides/team-setup' },
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
