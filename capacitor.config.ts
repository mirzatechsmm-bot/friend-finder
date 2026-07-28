import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.emerald.pos",
  appName: "Emerald POS",
  webDir: "dist",
  backgroundColor: "#052e2b",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#052e2b",
      showSpinner: false,
      launchAutoHide: true,
    },
  },
};

export default config;
