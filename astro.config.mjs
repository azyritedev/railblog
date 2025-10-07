// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";
import content from "@originjs/vite-plugin-content";

import node from "@astrojs/node";

import sitemap from "@astrojs/sitemap";

import umami from "@yeskunall/astro-umami";

// @ts-expect-error NODE_ENV cannot be forced into not-null using `!` as thi is an .mjs file
const { PUBLIC_UMAMI_ID, PUBLIC_UMAMI_ENDPOINT_URL } = loadEnv(process.env.NODE_ENV, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  site: "https://railblog.astrial.org",

  vite: {
    plugins: [tailwindcss(), content()],
  },

  // redirects: {
  //   "/gallery/tag/[tagid]/": "/gallery/tag/[tagid]/1", // pagination
  // },
  image: {
    // Example: Enable the Sharp-based image service with a custom config
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [
    sitemap(),
    umami({
      // @ts-expect-error See above expect-error declaration
      id: PUBLIC_UMAMI_ID,

      endpointUrl: PUBLIC_UMAMI_ENDPOINT_URL
    }),
  ],
});
