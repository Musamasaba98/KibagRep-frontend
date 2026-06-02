import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const SS_DIR = '/tmp/kibagrep_screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

let ss = 0;
async function shot(page, label) {
  const file = path.join(SS_DIR, `${String(++ss).padStart(2,'0')}_${label}.png`);
  await page.screenshot({ path: file });
  console.log(`📸 ${ss}. ${label}`);
  return file;
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(1500);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  await emailInput.fill(email);
  await passInput.fill('Test1234!');
  await passInput.press('Enter');
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch({ headless: true });

// ─── REP (mobile viewport) ────────────────────────────────────────────────────
console.log('\n══════════ REP PORTAL ══════════');
const repCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const rep = await repCtx.newPage();

console.log('1. Login as rep@kibagrep.dev');
await login(rep, 'rep@kibagrep.dev');
console.log('   URL:', rep.url());
await shot(rep, 'rep_01_home');

console.log('2. Call Cycle — existing items + KBL/BL/FOCUS badges');
await rep.goto(`${BASE}/rep-page/call-cycle`);
await rep.waitForTimeout(2500);
const tierA = await rep.locator('text=Tier A').first().isVisible().catch(() => false);
const badge = await rep.locator('text=KBL, text=BL, text=FOCUS').first().isVisible().catch(() => false);
console.log('   Tier A visible:', tierA, '| List-type badge visible:', badge);
await shot(rep, 'rep_02_call_cycle_with_items');

console.log('3. Call Cycle empty state — login as rep4 (new upcountry rep, no cycle)');
await repCtx.clearCookies();
await login(rep, 'rep4@kibagrep.dev');
await rep.goto(`${BASE}/rep-page/call-cycle`);
await rep.waitForTimeout(2500);
const gotoBtn = await rep.locator('button:has-text("Go to Doctors")').first().isVisible().catch(() => false);
console.log('   "Go to Doctors" button visible:', gotoBtn);
await shot(rep, 'rep_03_cycle_empty_state');

if (gotoBtn) {
  await rep.locator('button:has-text("Go to Doctors")').first().click();
  await rep.waitForTimeout(1500);
  console.log('   After click URL:', rep.url());
  const onDoctorsPage = rep.url().includes('/doctors');
  console.log('   Navigated to doctors page:', onDoctorsPage);
  await shot(rep, 'rep_04_doctors_page_after_cycle_click');
}

console.log('4. Offline badge — simulate network offline');
await repCtx.clearCookies();
await login(rep, 'rep@kibagrep.dev');
await rep.goto(`${BASE}/rep-page`);
await rep.waitForTimeout(1500);
await rep.context().setOffline(true);
await rep.waitForTimeout(1200);
const offlineBadge = await rep.locator('text=Offline').first().isVisible().catch(() => false);
console.log('   Offline badge shows:', offlineBadge);
await shot(rep, 'rep_05_offline_state');
await rep.context().setOffline(false);

console.log('5. Mobile nav — Events link present');
await rep.goto(`${BASE}/rep-page`);
await rep.waitForTimeout(1500);
// Look for events in bottom nav
const bottomNav = rep.locator('nav').last();
const navText = await bottomNav.textContent().catch(() => '');
console.log('   Bottom nav content snippet:', navText?.replace(/\s+/g,' ').trim().slice(0,120));
await shot(rep, 'rep_06_mobile_nav');

console.log('6. Expenses page');
await rep.goto(`${BASE}/rep-page/expenses`);
await rep.waitForTimeout(2000);
await shot(rep, 'rep_07_expenses');

console.log('7. Tour plan');
await rep.goto(`${BASE}/rep-page/tour-plan`);
await rep.waitForTimeout(2000);
await shot(rep, 'rep_08_tour_plan');

// ─── SUPERVISOR (desktop viewport) ────────────────────────────────────────────
console.log('\n══════════ SUPERVISOR PORTAL ══════════');
const supCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const sup = await supCtx.newPage();

console.log('8. Login as supervisor@kibagrep.dev');
await login(sup, 'supervisor@kibagrep.dev');
console.log('   URL:', sup.url());
await shot(sup, 'sup_01_home');

console.log('9. Activity Feed (Messages page)');
await sup.goto(`${BASE}/supervisor/messages`);
await sup.waitForTimeout(2500);
const h1 = await sup.locator('h1').first().textContent().catch(() => '?');
const tabCount = await sup.locator('button').filter({ hasText: /Reports|Expenses|Cycles|GPS/ }).count();
console.log('   H1:', h1?.trim(), '| Filter tabs:', tabCount);
await shot(sup, 'sup_02_activity_feed');

// Click Reports tab
const reportsTab = sup.locator('button:has-text("Reports")').first();
if (await reportsTab.isVisible().catch(() => false)) {
  await reportsTab.click();
  await sup.waitForTimeout(800);
  console.log('   Clicked Reports tab');
}
await shot(sup, 'sup_03_activity_feed_reports_tab');

console.log('10. Supervisor Events page');
await sup.goto(`${BASE}/supervisor/events`);
await sup.waitForTimeout(2000);
const evH1 = await sup.locator('h1').first().textContent().catch(() => '?');
console.log('   Events H1:', evH1?.trim());
await shot(sup, 'sup_04_events');

console.log('11. Approvals page');
await sup.goto(`${BASE}/supervisor/approvals`);
await sup.waitForTimeout(2000);
const apH1 = await sup.locator('h1').first().textContent().catch(() => '?');
console.log('   Approvals H1:', apH1?.trim());
await shot(sup, 'sup_05_approvals');

console.log('12. Team Map');
await sup.goto(`${BASE}/supervisor/team-map`);
await sup.waitForTimeout(2500);
await shot(sup, 'sup_06_team_map');

console.log('13. JFW page');
await sup.goto(`${BASE}/supervisor/jfw`);
await sup.waitForTimeout(2000);
await shot(sup, 'sup_07_jfw');

console.log('14. Supervisor dashboard — rep list & KPIs');
await sup.goto(`${BASE}/supervisor`);
await sup.waitForTimeout(2500);
await shot(sup, 'sup_08_dashboard');

// ─── PROBE: wrong password ─────────────────────────────────────────────────
console.log('\n🔍 Probe: wrong password shows error');
await sup.goto(`${BASE}/login`);
await sup.waitForTimeout(1000);
await sup.locator('input[type="email"]').first().fill('supervisor@kibagrep.dev');
await sup.locator('input[type="password"]').first().fill('wrongpassword');
await sup.locator('input[type="password"]').first().press('Enter');
await sup.waitForTimeout(1500);
const loginError = await sup.locator('text=Invalid, text=incorrect, text=wrong, text=error').first().isVisible().catch(() => false);
const stillOnLogin = sup.url().includes('login');
console.log('   Stays on login:', stillOnLogin, '| Error shown:', loginError);
await shot(sup, 'probe_01_wrong_password');

// ─── PROBE: rep cannot access supervisor route ─────────────────────────────
console.log('\n🔍 Probe: rep accessing supervisor URL gets redirected');
await repCtx.clearCookies();
await login(rep, 'rep@kibagrep.dev');
await rep.goto(`${BASE}/supervisor`);
await rep.waitForTimeout(1500);
const repOnSupPage = rep.url().includes('/supervisor') && !rep.url().includes('/login') && !rep.url().includes('/rep');
console.log('   Rep can access /supervisor:', repOnSupPage, '| URL:', rep.url());
await shot(rep, 'probe_02_rep_role_guard');

await browser.close();
console.log('\n══ All done. Screenshots in:', SS_DIR, '══');
