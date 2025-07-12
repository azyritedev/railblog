// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import content from "@originjs/vite-plugin-content";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
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
});