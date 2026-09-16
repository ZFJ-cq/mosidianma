import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 纯静态方案：构建产物可直接托管到 GitHub Pages。
// base 使用相对路径，保证部署到子路径（如 user.github.io/repo）时资源可正确加载。
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // PWA 插件：自动生成 service worker，实现离线可用与“添加到主屏幕”。
    VitePWA({
      registerType: 'autoUpdate', // 有新版本时自动后台更新
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '摩斯电码挑战',
        short_name: '摩斯挑战',
        description: '面向无线电爱好者与初学者的游戏化摩斯电码练习工具',
        lang: 'zh-CN',
        theme_color: '#0ea5e9',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 缓存所有构建产物与静态资源，实现离线访问
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
