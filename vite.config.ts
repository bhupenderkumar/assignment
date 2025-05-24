import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    host: true,
    open: true,
  },
  preview: {
    port: 5174,
    strictPort: false,
    host: true,
    open: true,
  },
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@dnd-kit/core', '@dnd-kit/sortable'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'uuid', 'dompurify'],
          'media-vendor': ['html2canvas', 'jspdf', 'konva', 'react-konva'],

          // Feature-based chunks
          'auth-features': [
            './src/context/SupabaseAuthContext.tsx',
            './src/components/pages/SignInPage.tsx',
            './src/components/pages/SignUpPage.tsx'
          ],
          'organization-features': [
            './src/context/OrganizationContext.tsx',
            './src/components/organization/OrganizationSwitcher.tsx',
            './src/pages/OrganizationManagementPage.tsx'
          ],
          'assignment-features': [
            './src/context/InteractiveAssignmentContext.tsx',
            './src/components/assignments/AssignmentList.tsx',
            './src/components/assignments/PlayAssignment.tsx'
          ],
          'exercise-features': [
            './src/components/exercises/EnhancedMatchingExercise.tsx',
            './src/components/exercises/MultipleChoiceExercise.tsx',
            './src/components/exercises/CompletionExercise.tsx',
            './src/components/exercises/OrderingExercise.tsx'
          ],
          'admin-features': [
            './src/components/admin/AdminDashboard.tsx',
            './src/components/admin/AssignmentForm.tsx',
            './src/components/admin/AnonymousUserActivity.tsx'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify for production
    minify: 'esbuild'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'konva',
      'react-konva'
    ]
  },
  // Define module resolution
  define: {
    global: 'globalThis',
  },
  // Performance optimizations
  esbuild: {
    // Only remove console logs in production, not in development
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  // Resolve buffer polyfill for browser compatibility
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  }
})
