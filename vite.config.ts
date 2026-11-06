import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // แยกก้อนข้อมูลบทเรียนและไลบรารีออกจากโค้ดแอป เพื่อให้แคชแยกกันและโค้ดแอปโหลดเร็วขึ้น
        manualChunks(id) {
          if (id.includes('/src/data/') && id.endsWith('.json')) return 'lesson-data';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
