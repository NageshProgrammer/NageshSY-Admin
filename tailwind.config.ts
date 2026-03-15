import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./client/index.html",
    "./client/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [animate],
  colors: {
  gold: "#F5C46B",
  goldSoft: "#F5C46B33",
  background: "",
}

};

export default config;
