import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ include: ['lib'] })],
  build: {
    copyPublicDir: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'RevogridPdf',
      fileName: 'revogrid-pdf-export',
    },
    rollupOptions: {
      external: [
        /^@revolist\/revogrid(\/.*)?$/,
        /^pdfmake(\/.*)?$/,
      ],
      output: {
        exports: 'named',
        globals: {
          '@revolist/revogrid': 'Revogrid',
          'pdfmake/build/pdfmake': 'pdfMake',
          'pdfmake/build/vfs_fonts': 'pdfFonts',
        },
      },
    },
  },
  server: {
    open: '/demo/index.html',
  },
});
