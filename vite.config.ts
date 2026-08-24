import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const stagingSeoPlugin = (isStaging: boolean) => ({
  name: 'staging-seo-protection',
  transformIndexHtml(html: string) {
    if (!isStaging) return html;
    return html.replace(
      '<head>',
      '<head>\n    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />',
    );
  },
  generateBundle(_options: unknown, bundle: Record<string, any>) {
    if (!isStaging) return;
    bundle['robots.txt'] = {
      type: 'asset',
      fileName: 'robots.txt',
      names: [],
      originalFileNames: [],
      source: 'User-agent: *\nDisallow: /\n',
    };
  },
});

export default defineConfig(({ mode }) => {
  const isStaging = mode === 'staging';
  return {
    plugins: [react(), tailwindcss(), stagingSeoPlugin(isStaging)],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('recharts') || id.includes('/d3')) return 'charts';
            if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) return 'firebase-firestore';
            if (id.includes('@firebase/auth') || id.includes('firebase/auth')) return 'firebase-auth';
            if (id.includes('@firebase/storage') || id.includes('firebase/storage')) return 'firebase-storage';
            if (id.includes('@firebase') || id.includes('/firebase/')) return 'firebase-core';
            return undefined;
          },
        },
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
