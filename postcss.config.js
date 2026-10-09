/*
 * CSS processing: generate Tailwind utilities and add browser vendor prefixes through PostCSS.
 */

import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcss(), autoprefixer()],
};
