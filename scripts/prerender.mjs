import { createServer, loadEnv } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { pageMetadata } from '../src/utils/page-metadata.js';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
let origin = '';
try {
  const url = new URL(env.VITE_PUBLIC_SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
  origin = url.origin;
} catch {
  console.warn('Public site URL is missing/invalid: canonical URLs and sitemap are omitted until configured.');
}
process.env.NODE_ENV = 'production';
const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
let shell = await readFile('dist/index.html', 'utf8');
// Repeated prerenders use the clean private shell rather than nesting prior page content.
if (!shell.includes('<div id="root"></div>')) shell = await readFile('dist/app.html', 'utf8');
const escape = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
try {
  const routes = ['/', '/doctors', '/billing', '/privacy', '/terms', '/contact'];
  for (const path of [...routes, '/404']) {
    let element;
    const shared = { theme: 'dark', onToggleTheme() {} };
    if (path === '/') {
      const { default: Component } = await server.ssrLoadModule('/src/components/LandingPage.jsx');
      element = React.createElement(Component, { ...shared, onStart() {}, onLogin() {} });
    } else if (path === '/doctors' || path === '/billing') {
      const file = path === '/doctors' ? 'DoctorPortal' : 'Billing';
      const { default: Component } = await server.ssrLoadModule(`/src/components/${file}.jsx`);
      element = React.createElement(Component, shared);
    } else if (path === '/404') {
      const { default: Component } = await server.ssrLoadModule('/src/components/NotFound.jsx');
      element = React.createElement(Component, { ...shared, onHome() {} });
    } else {
      const { default: Component } = await server.ssrLoadModule('/src/components/PublicInfo.jsx');
      element = React.createElement(Component, { ...shared, page: path.slice(1) });
    }
    const metadata = path === '/404' ? { title: 'Page not found — Aura', description: 'This page could not be found.', index: false } : pageMetadata(path);
    const markup = renderToString(React.createElement(MemoryRouter, { initialEntries: [path] }, element));
    let html = shell.replace(/<title>.*?<\/title>/, `<title>${escape(metadata.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${escape(metadata.description)}`)
      .replace(/(<meta name="robots" content=")[^"]*/, `$1${metadata.index ? 'index,follow' : 'noindex,follow'}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escape(metadata.title)}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${escape(metadata.description)}`)
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    if (path === '/doctors' || path === '/billing') {
      const prefix = path === '/doctors' ? 'DoctorPortal-' : 'Billing-';
      const css = (await readdir('dist/assets')).find(file => file.startsWith(prefix) && file.endsWith('.css'));
      if (css) html = html.replace('</head>', `<link rel="stylesheet" href="/assets/${css}" /></head>`);
    }
    if (origin) html = html.replace('</head>', `<link rel="canonical" href="${escape(origin + (path === '/' ? '/' : path))}" /><meta property="og:url" content="${escape(origin + path)}" /><meta property="og:image" content="${escape(origin + '/social-card.png')}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="Aura — a space to reflect" /></head>`);
    const directory = path === '/' ? 'dist' : `dist${path}`;
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/index.html`, html);
    if (path === '/404') await writeFile('dist/404.html', html);
  }
  // Private pages have no prerendered content and must stay out of the search index.
  await writeFile('dist/app.html', shell.replace('content="index,follow"', 'content="noindex,follow"'));
  // Let crawlers read the private shell's noindex directive; blocking it would hide that directive.
  const robots = 'User-agent: *\nAllow: /\nDisallow: /api/\n';
  await writeFile('dist/robots.txt', robots + (origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''));
  if (origin) await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${escape(origin + path)}</loc></url>`).join('')}</urlset>`);
  else await rm('dist/sitemap.xml', { force: true });
  console.log('Prerendered 6 public pages, 404, private app shell, and crawl controls.');
} finally { await server.close(); }
