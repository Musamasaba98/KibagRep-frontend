const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const SS_DIR = '/tmp/kibagrep_screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

let ss = 0;
async function shot(page, label) {
  const file = path.join(SS_DIR, `${String(++ss).padStart(2,'0')}_${label.replace(/\s+/g,'_')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${file}`);
  return file;
}

async function login(page, email, pw = 'Test1234!') {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"], input[name="email"]', { timeout: 8000 });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  await emailInput.fill(email);
  await passInput.fill(pw);
  await passInput.press('Enter');
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone size for rep
  const page = await context.newPage();

  console.log('\n════ REP PORTAL ════');

  // ── REP LOGIN ──────────────────────────────────────────────────────────────
  await login(page, 'rep@kibagrep.dev');
  console.log('URL after login:', page.url());
  await shot(page, 'rep_home');

  // ── CALL CYCLE ─────────────────────────────────────────────────────────────
  console.log('\n── Call Cycle ──');
  await page.goto(`${BASE}/rep-page/call-cycle`);
  await page.waitForTimeout(2000);
  const cycleTitle = await page.locator('h1').first().textContent().catch(() => '?');
  console.log('Cycle page title:', cycleTitle);
  // Check for KBL/BL/FOCUS badge
  const badgeText = await page.locator('text=KBL, text=BL, text=FOCUS').first().textContent().catch(() => null);
  console.log('List-type badge visible:', badgeText || 'none found');
  await shot(page, 'rep_call_cycle');

  // ── CALL CYCLE EMPTY STATE (new rep) ──────────────────────────────────────
  console.log('\n── Call Cycle Empty State (new rep4) ──');
  await context.clearCookies();
  await login(page, 'rep4@kibagrep.dev');
  await page.goto(`${BASE}/rep-page/call-cycle`);
  await page.waitForTimeout(2500);
  const gotoBtn = await page.locator('button:has-text("Go to Doctors")').first().isVisible().catch(() => false);
  console.log('"Go to Doctors" button visible:', gotoBtn);
  await shot(page, 'rep4_cycle_empty_state');

  // Click the button and verify navigation
  if (gotoBtn) {
    await page.locator('button:has-text("Go to Doctors")').first().click();
    await page.waitForTimeout(1500);
    console.log('After click URL:', page.url());
    await shot(page, 'rep4_doctors_after_click');
  }

  // ── OFFLINE BADGE (go offline) ────────────────────────────────────────────
  console.log('\n── Offline Badge ──');
  await page.goto(`${BASE}/rep-page`);
  await page.waitForTimeout(1500);
  await page.context().setOffline(true);
  await page.waitForTimeout(1000);
  const offlineBadge = await page.locator('text=Offline').isVisible().catch(() => false);
  console.log('Offline badge shows:', offlineBadge);
  await shot(page, 'rep_offline_badge');
  await page.context().setOffline(false);

  // ── MOBILE NAV ─────────────────────────────────────────────────────────────
  console.log('\n── Mobile Nav ──');
  await page.goto(`${BASE}/rep-page`);
  await page.waitForTimeout(1500);
  // Check Events is in mobile nav
  const eventsLink = await page.locator('nav a[href*="events"], nav text=Events').first().isVisible().catch(() => false);
  console.log('Events in mobile nav:', eventsLink);
  await shot(page, 'rep_mobile_nav');

  // ── REP TOUR PLAN ─────────────────────────────────────────────────────────
  console.log('\n── Tour Plan ──');
  await page.goto(`${BASE}/rep-page/tour-plan`);
  await page.waitForTimeout(2000);
  const tourTitle = await page.locator('h1, h2').first().textContent().catch(() => '?');
  console.log('Tour plan title:', tourTitle?.trim());
  await shot(page, 'rep_tour_plan');

  // ── REP EXPENSES ──────────────────────────────────────────────────────────
  console.log('\n── Expenses ──');
  await page.goto(`${BASE}/rep-page/expenses`);
  await page.waitForTimeout(2000);
  await shot(page, 'rep_expenses');

  console.log('\n════ SUPERVISOR PORTAL ════');
  await context.clearCookies();
  const supContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const supPage = await supContext.newPage();

  await login(supPage, 'supervisor@kibagrep.dev');
  console.log('Supervisor URL after login:', supPage.url());
  await shot(supPage, 'sup_home');

  // ── ACTIVITY FEED (Messages) ──────────────────────────────────────────────
  console.log('\n── Activity Feed ──');
  await supPage.goto(`${BASE}/supervisor/messages`);
  await supPage.waitForTimeout(2500);
  const feedTitle = await supPage.locator('h1').first().textContent().catch(() => '?');
  console.log('Activity feed title:', feedTitle?.trim());
  const filterTabs = await supPage.locator('button').filter({ hasText: /Reports|Expenses|GPS/ }).count();
  console.log('Filter tabs visible:', filterTabs);
  await shot(supPage, 'sup_activity_feed');

  // ── APPROVALS ─────────────────────────────────────────────────────────────
  console.log('\n── Approvals ──');
  await supPage.goto(`${BASE}/supervisor/approvals`);
  await supPage.waitForTimeout(2000);
  await shot(supPage, 'sup_approvals');
  const approvalTitle = await supPage.locator('h1').first().textContent().catch(() => '?');
  console.log('Approvals title:', approvalTitle?.trim());

  // ── FIELD EVENTS ──────────────────────────────────────────────────────────
  console.log('\n── Supervisor Events ──');
  await supPage.goto(`${BASE}/supervisor/events`);
  await supPage.waitForTimeout(2000);
  const evTitle = await supPage.locator('h1').first().textContent().catch(() => '?');
  console.log('Events page title:', evTitle?.trim());
  await shot(supPage, 'sup_events');

  // ── TEAM MAP ──────────────────────────────────────────────────────────────
  console.log('\n── Team Map ──');
  await supPage.goto(`${BASE}/supervisor/team-map`);
  await supPage.waitForTimeout(2500);
  await shot(supPage, 'sup_team_map');

  // ── JFW ───────────────────────────────────────────────────────────────────
  console.log('\n── JFW ──');
  await supPage.goto(`${BASE}/supervisor/jfw`);
  await supPage.waitForTimeout(2000);
  await shot(supPage, 'sup_jfw');

  await browser.close();
  console.log('\nDone. Screenshots in:', SS_DIR);
})().catch(e => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
