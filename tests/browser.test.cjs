// Real Chromium, with every URL intercepted: no external analytics or form traffic.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { if (browser) await browser.close(); });

async function setup(t, file, viewport, response = 'success') {
  const context = await browser.newContext({ viewport });
  t.after(() => context.close());
  const page = await context.newPage();
  const posts = [];
  const errors = [];
  let mode = response;
  let release;
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', dialog => dialog.dismiss());
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'POST') {
      posts.push(request.postData());
      if (mode === 'network') return route.abort('failed');
      if (mode === 'pending') await new Promise(resolve => { release = resolve; });
      return route.fulfill({ status: mode === 'http' ? 500 : 200, body: 'test acknowledgement' });
    }
    if (url.hostname === 'cdnjs.cloudflare.com' && /\/(gsap|ScrollTrigger)\.min\.js$/.test(url.pathname)) {
      return route.fulfill({ path: require.resolve('gsap/dist/' + path.basename(url.pathname)), contentType: 'text/javascript' });
    }
    if (url.hostname !== 'bwf.test') {
      // No external network is permitted, including gtag.js, fonts and collect calls.
      return route.fulfill({ status: 200, body: '', contentType: 'text/javascript' });
    }
    const local = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    assert.ok(local.startsWith(root + path.sep));
    if (/\.(webp|png|ico)$/.test(local)) {
      return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') });
    }
    return route.fulfill({ path: local, contentType: local.endsWith('.js') ? 'text/javascript' : 'text/html' });
  });
  await page.goto('https://bwf.test/' + file, { waitUntil: 'load' });
  return {
    page, posts, errors,
    event: name => page.evaluate(name => (window.dataLayer || []).filter(e => e[0] === 'event' && e[1] === name).map(e => e[2]), name),
    mode(value) { mode = value; },
    finish() { release(); },
    async view() {
      await page.locator('#fn').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'bwf_form_view'));
    },
    async valid() {
      await page.locator('#fn').fill('PrivateFirst');
      await page.locator('#ln').fill('PrivateLast');
      await page.locator('#em').fill('private-person@example.invalid');
      await page.locator('#pt').selectOption({ index: 1 });
      await page.locator('#mg').fill('Private project description');
    },
    async success() {
      await page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'generate_lead'));
      assert.equal((await this.event('generate_lead')).length, 1);
      assert.equal((await this.event('generate_lead'))[0].send_to, 'G-XZQ389ZLRW');
      assert.equal((await this.event('conversion')).length, 0);
      assert.equal(posts.length, 1);
      assert.equal(await page.locator('#qform').isVisible(), false);
    }
  };
}

for (const file of ['index.html', 'custom/kitchens.html']) {
  for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
    test(file + ': real rendering and funnel at ' + viewport.width + 'px', async t => {
      const h = await setup(t, file, viewport);
      assert.equal((await h.event('bwf_form_view')).length, 0);
      await h.page.locator('[data-bwf-quote-cta="hero"]').click();
      assert.equal((await h.event('bwf_quote_click')).length, 1);
      await h.view();
      await h.page.locator('#fn').focus();
      assert.equal((await h.event('bwf_form_start')).length, 0);
      await h.valid();
      assert.equal((await h.event('bwf_form_start')).length, 1);
      await h.page.locator('.fsub').click();
      await h.success();
      await h.page.reload({ waitUntil: 'load' });
      assert.equal(await h.page.locator('#qform').isVisible(), false);
      assert.equal((await h.event('generate_lead')).length, 0);
      assert.equal((await h.event('bwf_form_view')).length, 0);
      assert.ok((await h.event('form_resubmit_blocked')).length);
      assert.deepEqual(h.errors, []);
    });
  }

  test(file + ': real native validation, failure/retry, concurrent submit and cross-page lock', async t => {
    const h = await setup(t, file, { width: 1365, height: 900 }, 'http');
    await h.view();
    await h.page.locator('.fsub').click();
    assert.ok((await h.event('bwf_form_error')).some(e => e.error_type === 'validation'));
    assert.equal(h.posts.length, 0);
    await h.valid();
    await h.page.locator('.fsub').click();
    await h.page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'bwf_form_error' && e[2].error_type === 'http'));
    assert.equal((await h.event('generate_lead')).length, 0);
    h.mode('pending');
    await h.page.evaluate(() => { const f = document.getElementById('qform'); f.requestSubmit(); f.requestSubmit(); });
    await h.page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'form_resubmit_blocked' && e[2].block_reason === 'in_flight'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.posts.length, 2);
    h.mode('success'); h.finish();
    await h.page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'generate_lead'));
    assert.equal((await h.event('generate_lead')).length, 1);
    const other = file === 'index.html' ? 'custom/kitchens.html' : 'index.html';
    await h.page.goto('https://bwf.test/' + other, { waitUntil: 'load' });
    assert.equal(await h.page.locator('#qform').isVisible(), false);
    assert.equal((await h.event('generate_lead')).length, 0);
    assert.deepEqual(h.errors, []);
  });
}

for (const file of ['faq.html', 'reviews.html']) {
  test(file + ': real tag queue initialization and keyboard quote activation', async t => {
    const h = await setup(t, file, { width: 1365, height: 900 });
    assert.equal(await h.page.evaluate(() => window.dataLayer.filter(e => e[0] === 'config' && e[1] === 'G-XZQ389ZLRW').length), 1);
    // Suppress only navigation so the source page's queued event can be asserted.
    await h.page.evaluate(() => document.addEventListener('click', e => e.preventDefault()));
    await h.page.locator('[data-bwf-quote-cta]').first().focus();
    await h.page.keyboard.press('Enter');
    assert.equal((await h.event('bwf_quote_click')).length, 1);
    assert.equal((await h.event('bwf_quote_click'))[0].page_type, file.replace('.html', ''));
    assert.deepEqual(h.errors, []);
  });
}

// Actual Back/Forward navigation in Chromium. This harness disables BFCache and
// restores documents by loading them; persisted pageshow is tested in funnel.test.cjs.
for (const file of ['index.html', 'custom/kitchens.html']) {
  for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
    test(file + ': Back/Forward before and after submission at ' + viewport.width + 'px', async t => {
      const h = await setup(t, file, viewport);
      await h.view();
      await h.valid();
      await h.page.goto('https://bwf.test/faq.html', { waitUntil: 'load' });
      await h.page.goBack({ waitUntil: 'load' });
      assert.equal(await h.page.locator('#qform').isVisible(), true);
      assert.equal(h.posts.length, 0);
      assert.equal((await h.event('generate_lead')).length, 0);
      await h.view(); await h.valid();
      await h.page.locator('.fsub').click();
      await h.success();
      await h.page.goForward({ waitUntil: 'load' });
      assert.ok(h.page.url().endsWith('/faq.html'));
      await h.page.goBack({ waitUntil: 'load' });
      assert.equal(await h.page.locator('#qform').isVisible(), false);
      assert.equal((await h.event('generate_lead')).length, 0);
      assert.equal((await h.event('form_resubmit_blocked')).length, 1);
      assert.equal(h.posts.length, 1);
      assert.deepEqual(h.errors, []);
    });
  }

  test(file + ': Back to other form respects the shared lock', async t => {
    const h = await setup(t, file, { width: 390, height: 844 });
    const other = file === 'index.html' ? 'custom/kitchens.html' : 'index.html';
    await h.page.goto('https://bwf.test/' + other, { waitUntil: 'load' });
    await h.view(); await h.valid();
    await h.page.locator('.fsub').click();
    await h.success();
    await h.page.goBack({ waitUntil: 'load' });
    assert.equal(await h.page.locator('#qform').isVisible(), false);
    assert.equal((await h.event('generate_lead')).length, 0);
    assert.equal(h.posts.length, 1);
    assert.deepEqual(h.errors, []);
  });

  test(file + ': direct fragment, scroll return and network retry on mobile', async t => {
    const fragment = file === 'index.html' ? '#contact' : '#quote';
    const h = await setup(t, file + fragment, { width: 390, height: 844 }, 'network');
    await h.view();
    assert.equal((await h.event('bwf_quote_click')).length, 0);
    await h.page.evaluate(() => window.scrollTo(0, 0));
    await h.view();
    assert.equal((await h.event('bwf_form_view')).length, 1);
    await h.valid();
    await h.page.locator('.fsub').click();
    await h.page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'bwf_form_error' && e[2].error_type === 'network'));
    assert.equal((await h.event('generate_lead')).length, 0);
    assert.equal(await h.page.locator('.fsub').isEnabled(), true);
    h.mode('success');
    await h.page.locator('.fsub').click();
    await h.page.waitForFunction(() => (window.dataLayer || []).some(e => e[1] === 'generate_lead'));
    assert.equal((await h.event('generate_lead')).length, 1);
    assert.equal((await h.event('bwf_form_submit')).length, 2);
    assert.equal(h.posts.length, 2);
    assert.deepEqual(h.errors, []);
  });
}
