/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.CIVITAS_VITE_PUBLIC_SUPABASE_URL ||
    env.CIVITAS_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    ''

  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.CIVITAS_VITE_PUBLIC_SUPABASE_ANON_KEY ||
    env.CIVITAS_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    ''

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      watch: {
        ignored: ['**/.env', '**/.env.*', '**/.env.local'],
      },
      hmr: {
        timeout: 60000,
        overlay: false,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'ui-vendor': ['@radix-ui/react-checkbox', '@radix-ui/react-slider', '@radix-ui/react-switch'],
            'charts': ['recharts'],
            'exceljs': ['exceljs'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: false,
      env: {
        NODE_ENV: 'development',
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_VAPID_PUBLIC_KEY: '',
      },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/**/*.d.ts'],
        reporter: ['text', 'text-summary', 'lcov'],
        thresholds: {
          lines: 5,
          functions: 18,
          branches: 40,
          statements: 5,
        },
      },
    },
  }
})
