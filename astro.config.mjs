// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import content from "@originjs/vite-plugin-content";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), content()],
  },
});
