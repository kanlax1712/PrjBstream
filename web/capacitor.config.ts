import type { CapacitorConfig } from '@capacitor/cli';

// Production URL configured
const PRODUCTION_URL = 'https://bstreamtest.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.bstream.app',
  appName: 'Bstream',
  webDir: 'out',
  server: {
    // Production URL configured
    url: 'https://bstreamtest.vercel.app',
    androidScheme: 'https',
    allowNavigation: [
      PRODUCTION_URL,
      'http://localhost:3000',
      'https://*.vercel.app',
      'https://*.vercel-storage.com',
      'https://*.blob.vercel-storage.com',
      'https://storage.googleapis.com',
      'https://images.unsplash.com',
      'https://api.dicebear.com',
      'https://i.ytimg.com',
      'https://*.ytimg.com',
      'https://*.googleapis.com'
    ],
    cleartext: true // Allow HTTP for local development
  },
  // Android minSdkVersion is configured in android/variables.gradle (set to 26 for Android 8.0)
};

export default config;
