import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "FluffiLyn's Blog",
  description: "b",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    logo: '/logo.svg',

    sidebar: generateSidebar({
      documentRootPath: '/docs',
      collapsed: true,
      capitalizeFirst: true,
      debugPrint: true
    }),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
