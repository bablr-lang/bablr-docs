import { defineConfig } from "astro/config";
import starlight from "@bablr/starlight";
import { findUpMultipleSync as findUp } from "find-up";
import { dirname } from "node:path";

import node from "@astrojs/node";

let gitRoots = findUp(".git", { cwd: import.meta.url, type: "directory" });

// https://astro.build/config
export default defineConfig({
  i18n: {
    prefixDefaultLocale: false,
    locales: ["en"],
    defaultLocale: "en",
  },

  integrations: [
    starlight({
      title: "Docs",
      logo: {
        light: "./src/images/BABLR.svg",
        dark: "./src/images/BABLR_dark.svg",
      },
      prerender: true,
      favicon: "/favicon.ico",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/bablr-lang/",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/NfMNyYN6cX",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        // {
        //   label: 'Reference',
        //   autogenerate: { directory: 'reference' },
        // },
        {
          label: "Architecture",
          autogenerate: { directory: "architecture" },
        },
        {
          label: "Philosophy",
          autogenerate: { directory: "philosophy" },
        },
      ],
      customCss: ["./src/styles/global.css"],
    }),
  ],
  server: { port: 4321 },
  vite: {
    server: {
      fs: { allow: gitRoots && [dirname(gitRoots[gitRoots.length - 1])] },
    },
  },
  site: "https://build.bablr.org",
  adapter: node({
    mode: "standalone",
  }),
});
