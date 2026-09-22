import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Electron 生产模式通过 file:// 加载，静态资源必须使用相对路径。
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
