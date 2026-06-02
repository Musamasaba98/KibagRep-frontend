import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:4000/api';
const SS_DIR = '/tmp/kibagrep_screenshots';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// Inject auth
const body = await (await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'supervisor@kibagrep.dev', password: 'Test1234!' }),
})).json();

await page.goto(`${BASE}/login`);
await page.waitForTimeout(500);
await page.evaluate(({ token, user }) => {
  localStorage.setItem('persist:root', JSON.stringify({
    auth: JSON.stringify({ token, user, isAuthenticated: true }),
    _persist: '{"version":-1,"rehydrated":true}',
  }));
}, { token: body.token, user: body.data });

// Test correct map route
await page.goto(`${BASE}/supervisor/map`);
await page.waitForTimeout(4000);
console.log('Map URL:', page.url());
const mapEl = await page.locator('.leaflet-container, [class*="leaflet"], canvas').first().isVisible().catch(() => false);
console.log('Map element visible:', mapEl);
await page.screenshot({ path: `${SS_DIR}/31_sup_team_map_correct_route.png` });
console.log('📸 31. sup_team_map_correct_route');

await browser.close();
