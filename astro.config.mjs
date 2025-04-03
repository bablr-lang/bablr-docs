// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import node from "@astrojs/node";

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
      logo: { src: "./src/images/BABLRTransparent.png" },
      prerender: false,
      favicon: "/favicon.ico",
      social: {
        github: "https://github.com/bablr-lang/bablr-docs",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
  server: { port: 4321 },
  site: "https://build.bablr.org",
  adapter: node({
    mode: "standalone",
  }),
});
