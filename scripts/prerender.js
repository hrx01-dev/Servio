#!/usr/bin/env node

/**
 * Pre-rendering script for static HTML generation
 * Runs after `vite build` to generate static HTML files for better SEO
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;
const ROUTES = ['/', '404.html'];

// Simple HTTP server to serve dist files
function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Normalize the URL pathname to prevent directory traversal
      let urlPath = new URL(req.url, `http://localhost:${port}`).pathname;
      urlPath = path.normalize(urlPath);

      // Default to index.html for root or 404.html
      if (urlPath === '/' || urlPath === '/404.html') {
        urlPath = '/index.html';
      }

      // Resolve the full file path
      let filePath = path.resolve(DIST_DIR, '.' + urlPath);
      const distDirResolved = path.resolve(DIST_DIR);

      // Validate that the resolved path is within DIST_DIR (prevent directory traversal)
      if (!filePath.startsWith(distDirResolved)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      console.log(`[Prerender] Server started on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function prerender() {
  console.log('[Prerender] Starting pre-rendering process...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[Prerender] Error: dist directory not found at ${DIST_DIR}`);
    process.exit(1);
  }

  let server;
  let browser;

  try {
    // Start server
    server = await startServer(PORT);

    // Launch browser — --no-sandbox is required for GitHub Actions / CI environments
    // where unprivileged user namespaces are disabled (Ubuntu 23.10+ with AppArmor).
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('[Prerender] Browser launched');

    // Track failed routes for error reporting
    const failedRoutes = [];

    // Pre-render each route
    for (const route of ROUTES) {
      // Skip 404.html as it's not a real route
      if (route === '404.html') {
        continue;
      }

      const routePath = route === '/' ? '/index.html' : `/${route}`;
      const url = `http://localhost:${PORT}${route}`;

      try {
        const page = await browser.newPage();

        // Set viewport to ensure consistent rendering
        await page.setViewport({ width: 1280, height: 800 });

        // Wait for page to fully load
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log(`[Prerender] Rendered: ${route}`);

        // Get HTML content
        const html = await page.content();

        // Save to file
        const outputPath = path.join(DIST_DIR, routePath);
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, html);
        console.log(`[Prerender] Saved: ${outputPath}`);

        await page.close();
      } catch (error) {
        console.error(`[Prerender] Error rendering ${route}:`, error.message);
        failedRoutes.push(route);
      }
    }

    // Check for failed routes and exit with error if any occurred
    if (failedRoutes.length > 0) {
      throw new Error(`Pre-rendering failed for routes: ${failedRoutes.join(', ')}`);
    }

    console.log('[Prerender] ✓ Pre-rendering completed successfully');
  } catch (error) {
    console.error('[Prerender] Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.close();
    }
  }
}

prerender();
