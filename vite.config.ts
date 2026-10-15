import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [
          'icon.png',
          'icon.svg',
          'manifest.json',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/apple-touch-icon.png',
          'screenshot-wide.png',
          'screenshot-narrow.png'
        ],
        manifest: {
          id: '/',
          name: 'النظام المحاسبي الذكي',
          short_name: 'المحاسبي الذكي',
          description: 'نظام محاسبة ومبيعات متكامل يعمل بالكامل محلياً وأوفلاين مع مستشار مالي ذكي ودعم قارئ الباركود والطباعة وإدارة الديون.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser'],
          orientation: 'any',
          dir: 'rtl',
          lang: 'ar',
          start_url: '/',
          scope: '/',
          categories: ['finance', 'business', 'productivity', 'utilities'],
          prefer_related_applications: false,
          related_applications: [
            {
              platform: 'play',
              id: 'app.azamfahd.account20.twa',
              url: 'https://github.com/azamfahd/account20/releases'
            },
            {
              platform: 'webapp',
              url: 'https://azamfahd.github.io/account20/manifest.json'
            }
          ],
          shortcuts: [
            {
              name: 'نقطة البيع (الكاشير)',
              short_name: 'الكاشير',
              description: 'فتح واجهة البيع السريع وإصدار الفواتير الفورية',
              url: '/?tab=pos',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'إدارة المخزون والمنتجات',
              short_name: 'المخزون',
              description: 'جرد البضائع وتعديل الأسعار والكميات وتتبع النواقص',
              url: '/?tab=products',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'حسابات العملاء والديون',
              short_name: 'العملاء',
              description: 'متابعة كشوفات الحساب وسداد الديون والآجل',
              url: '/?tab=customers',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'المستشار الذكي والتحليلات',
              short_name: 'التحليلات',
              description: 'استشارات مالية ذكية وتحليلات الأرباح والمخاطر',
              url: '/?tab=analytics',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'سجل المبيعات والحركات',
              short_name: 'السجل',
              description: 'استعراض وتعديل فواتير البيع ومراجعة العمليات',
              url: '/?tab=history',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'لوحة الإحصائيات والأرباح',
              short_name: 'الإحصائيات',
              description: 'الاطلاع على تقارير المبيعات والأرباح اليومية والشهرية',
              url: '/?tab=dashboard',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            }
          ],
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'لوحة النظام المحاسبي الذكي على الكمبيوتر والأجهزة اللوحية'
            },
            {
              src: '/screenshot-narrow.png',
              sizes: '540x1170',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'لوحة النظام المحاسبي الذكي على الهاتف'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB limit
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          navigateFallbackDenylist: [
            /\.apk$/i,
            /.*\.apk.*/i,
            /^\/api\/.*/,
            /^https?:\/\/github\.com\/.*/i,
            /^https?:\/\/.*githubusercontent\.com\/.*/i
          ],
          ignoreURLParametersMatching: [/.*/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts';
              }
              if (id.includes('firebase')) {
                return 'firebase';
              }
              if (id.includes('dexie')) {
                return 'db';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-is'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
        'motion/react',
        'lucide-react',
        'recharts',
        'dexie',
      ],
    },
    server: {
      hmr: false,
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
