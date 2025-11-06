import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const buildMode = process.env.BUILD_MODE || 'dev'
const isProd = buildMode === 'production'
const isStaging = buildMode === 'staging'

export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd && !isStaging,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: buildMode === 'staging' ? 'dist-staging' : 
            buildMode === 'production' ? 'dist-production' : 'dist',
    sourcemap: !isProd && !isStaging,
    minify: isProd || isStaging,
    rollupOptions: {
      output: {
        manualChunks: isProd || isStaging ? {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts', 'chart.js', 'react-chartjs-2'],
          supabase: ['@supabase/supabase-js']
        } : undefined
      }
    }
  },
  define: {
    __APP_ENV__: JSON.stringify(buildMode)
  }
})