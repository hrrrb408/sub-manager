import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.submanager.app',
  appName: 'SubManager',
  webDir: 'www',
  server: {
    url: 'https://your-domain.com',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
    },
  },
};

export default config;
