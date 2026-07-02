import { defineConfig } from 'vitest/config'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    headers: {
      // Prevents browsers from guessing the MIME type, forcing them to use the declared type
      'X-Content-Type-Options': 'nosniff',
      // Prevents the site from being framed, protecting against clickjacking attacks
      'X-Frame-Options': 'DENY',
      // Enables cross-site scripting (XSS) filtering in the browser and blocks the page if an attack is detected
      'X-XSS-Protection': '1; mode=block',
      // Controls how much referrer information is included with requests, protecting user privacy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Restricts where resources can be loaded from, mitigating XSS and data injection attacks
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-src 'self' https:; object-src 'none';",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    manifest: true,
    rollupOptions: {
      output: {
        // Group large vendor libraries into stable named chunks so browsers
        // can cache them independently of app code changes.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) {
              return 'vendor-react';
            }
            if (id.includes('/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('/motion/') || id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/gsap/')) {
              return 'vendor-gsap';
            }
            if (id.includes('/lenis/')) {
              return 'vendor-lenis';
            }
            if (id.includes('/three/') || id.includes('/@react-three/')) {
              return 'vendor-three';
            }
            if (id.includes('/@mui/') || id.includes('/@emotion/')) {
              return 'vendor-mui';
            }
            if (id.includes('/recharts/') || id.includes('/d3-')) {
              return 'vendor-charts';
            }
          }
        },
      },
    },
  },

  // ── Vitest configuration ────────────────────────────────────────────────
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Deterministic test env, independent of any local .env(.local):
    //  - Pin the admin dev-mock OFF so component tests exercise the real
    //    (production-like) signed-out UI.
    //  - Provide dummy Firebase config so getAuth()/getFirestore() initialise
    //    instead of throwing `auth/invalid-api-key` where no secrets exist
    //    (e.g. CI). These only satisfy the SDK's init-time validation — no
    //    network call is made (no auth/firestore listener is mounted in tests).
    env: {
      VITE_ADMIN_DEV_MOCK: '',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'servio-test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'servio-test',
      VITE_FIREBASE_STORAGE_BUCKET: 'servio-test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
      VITE_FIREBASE_APP_ID: '1:1234567890:web:serviotest',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
