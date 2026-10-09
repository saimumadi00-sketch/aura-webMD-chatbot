/*
 * Tailwind configuration: source discovery and typography/forms/container-query extensions.
 */

/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure this matches your file structure!
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
    forms,
    containerQueries,
  ],
}
