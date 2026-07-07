import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: '/docs/',
  title: 'ThiruXDB',
  description: 'A self-hosted API data aggregation dashboard',
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/ThiruXD/ThiruXDB' },
    ],
  },
  builderConfig: {
    output: {
      distPath: {
        root: 'doc_build',
      },
    },
  },
  outDir: 'doc_build'
});
