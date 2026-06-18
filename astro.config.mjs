import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import speedInsights from '@vercel/speed-insights/astro';

export default defineConfig({
  integrations: [react(), speedInsights()],
  output: 'server',
  adapter: vercel()
});
