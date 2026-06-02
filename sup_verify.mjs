import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:4000/api';
const SS_DIR = '/tmp/kibagrep_screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });
let ss = 20;
const shot = async (page, label) => {
  const f = path.join(SS_DIR, `${String(++ss).padStart(2,'0')}_${label}.png`);
  await page.screenshot({ path: f });
  console.log(`📸 ${ss}. ${label}`);
};

async function injectAuth(page, email, goTo) {
  const resp = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test1234!' }),
  });
  const body = await resp.json();
  const token = body.token;
  const user = body.data;
  if (!token) throw new Error('No token for ' + email);
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await page.evaluate(({ token, user }) => {
    const authState = JSON.stringify({ token, user, isAuthenticated: true });
    localStorage.setItem('persist:root', JSON.stringify({
      auth: authState,
      _persist: '{"version":-1,"rehydrated":true}',
    }));
  }, { token, user });
  await page.goto(`${BASE}${goTo}`);
  await page.waitForTimeout(3000);
  console.log(`${email} → ${page.url()}`);
}

const browser = await chromium.launch({ headless: true });

// ── SUPERVISOR ───────────────────────────────────────────────────────────────
console.log('\n══ SUPERVISOR PORTAL ══');
const sc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const s = await sc.newPage();

await injectAuth(s, 'supervisor@kibagrep.dev', '/supervisor');
await shot(s, 'sup_01_dashboard');

await s.goto(`${BASE}/supervisor/messages`);
await s.waitForTimeout(3000);
const fH1 = await s.locator('h1').first().textContent().catch(() => '?');
const tabs = await s.locator('button').filter({ hasText: /All|Reports|GPS|Expenses/ }).count();
console.log('Activity Feed:', fH1?.trim(), '| tabs:', tabs);
await shot(s, 'sup_02_activity_feed');

await s.goto(`${BASE}/supervisor/events`);
await s.waitForTimeout(2500);
const eH1 = await s.locator('h1').first().textContent().catch(() => '?');
console.log('Events:', eH1?.trim());
await shot(s, 'sup_03_events');

await s.goto(`${BASE}/supervisor/approvals`);
await s.waitForTimeout(2500);
const aH1 = await s.locator('h1').first().textContent().catch(() => '?');
console.log('Approvals:', aH1?.trim());
await shot(s, 'sup_04_approvals');

await s.goto(`${BASE}/supervisor/team-map`);
await s.waitForTimeout(4000);
await shot(s, 'sup_05_team_map');

await s.goto(`${BASE}/supervisor/jfw`);
await s.waitForTimeout(2500);
const jH1 = await s.locator('h1').first().textContent().catch(() => '?');
console.log('JFW:', jH1?.trim());
await shot(s, 'sup_06_jfw');

await s.goto(`${BASE}/supervisor/reps`);
await s.waitForTimeout(2500);
await shot(s, 'sup_07_reps');

// Check sidebar Events link
const evLink = await s.locator('a[href*="events"]').first().isVisible().catch(() => false);
console.log('Sidebar has Events link:', evLink);

// ── Probes ───────────────────────────────────────────────────────────────────
console.log('\n🔍 Rep → /supervisor blocked?');
const rc = await browser.newContext({ viewport: { width: 390, height: 844 } });
const r = await rc.newPage();
await injectAuth(r, 'rep2@kibagrep.dev', '/rep-page');
await r.goto(`${BASE}/supervisor`);
await r.waitForTimeout(1500);
const repBlocked = !r.url().includes('/supervisor') || r.url().includes('login') || r.url().includes('unauthorized');
console.log('   URL:', r.url(), '| blocked:', repBlocked);
await shot(r, 'probe_01_rep_blocked');

console.log('\n🔍 Supervisor → /admin blocked?');
await s.goto(`${BASE}/admin`);
await s.waitForTimeout(1500);
const supBlocked = !s.url().includes('/admin') || s.url().includes('login');
console.log('   URL:', s.url(), '| blocked:', supBlocked);
await shot(s, 'probe_02_sup_blocked_admin');

await browser.close();
console.log('\n✓', SS_DIR);
// This block is not executed — appending won't work; run inline instead
