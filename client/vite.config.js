import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'GOOGLE_', 'DATABASE_', 'TIDB_'],
  build: {
    // Raise the warning threshold slightly (default 500KB)
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // TensorFlow into its own huge chunk (loaded only on /report)
          if (id.includes('@tensorflow')) return 'tensorflow';

          // Leaflet / react-leaflet into map chunk (lazy-loaded)
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'leaflet';

          // Chart.js
          if (id.includes('chart.js') || id.includes('react-chartjs')) return 'chartjs';

          // react-icons (large icon library)
          if (id.includes('react-icons')) return 'icons';

          // Axios
          if (id.includes('axios')) return 'axios';

          // Everything else from node_modules into vendor
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})
