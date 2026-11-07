// Offline DOM integration tests. No page resources, Google requests or Netlify POSTs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'bwf-funnel-v1.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(t, file, options = {}) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://brandtwf.com/' + file,
    runScripts: 'outside-only',
    pretendToBeVisual: true
    // No resources option: scripts, fonts, images and tags cannot make network requests.
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  const d = w.document;
  const form = d.getElementById('qform');
  const events = [];
  const posts = [];
  const alerts = [];
  let respond = options.respond || (() => Promise.resolve({ ok: true, status: 200 }));
  w.gtag = (...args) => { events.push(args); if (options.gtagThrows) throw new Error('blocked tag'); };
  if (options.noGtag) delete w.gtag;
  w.fetch = (...args) => { posts.push(args); return respond(...args); };
  w.alert = msg => alerts.push(msg);
  if (options.timestamp) w.localStorage.setItem('bwf_lead_sent', String(options.timestamp));
  if (options.storageDenied) Object.defineProperty(w, 'localStorage', { get() { throw new Error('denied'); } });
  Object.defineProperty(d, 'currentScript', { value: d.querySelector('script[src="/bwf-funnel-v1.js"]') });
  // jsdom has no layout engine. Geometry/visibility are explicit test inputs.
  let geometry = { top: 2000, bottom: 2040, left: 0, right: 300, height: 40, width: 300 };
  const first = form && form.elements.namedItem('first-name');
  if (first) first.getBoundingClientRect = () => geometry;
  let hidden = false;
  w.getComputedStyle = el => ({
    display: el.style.display || 'block',
    visibility: 'visible',
    opacity: hidden && el === form ? '0' : '1'
  });
  let intersection;
  w.IntersectionObserver = class {
    constructor(fn) { intersection = fn; }
    observe() {}
    disconnect() {}
  };
  if (options.noObserver) delete w.IntersectionObserver;
  // Let the analytics handler see clicks, but don't navigate to another document.
  d.addEventListener('click', e => e.preventDefault());
  w.eval(code);
  return {
    w, d, form, events, posts, alerts,
    event(name) { return events.filter(e => e[1] === name); },
    fill(name, value, type = 'input') {
      const field = form.elements.namedItem(name);
      field.value = value;
      field.dispatchEvent(new w.Event(type, { bubbles: true }));
    },
    valid() {
      this.fill('first-name', 'PrivateFirst'); this.fill('last-name', 'PrivateLast');
      this.fill('email', 'private-person@example.invalid');
      this.fill('message', 'Private project description');
      this.fill('city', 'PrivateCity'); this.fill('phone', '+15555550123');
      this.fill('project-type', form.elements.namedItem('project-type').options[1].value, 'change');
    },
    submit() { form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); },
    click(node) { node.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); },
    show({ opacityZero = false, height = 768 } = {}) {
      hidden = opacityZero;
      w.innerHeight = height;
      geometry = { top: 100, bottom: 140, left: 0, right: 300, height: 40, width: 300 };
      if (intersection) intersection([]);
      else w.dispatchEvent(new w.Event('scroll'));
    },
    setResponse(fn) { respond = fn; }
  };
}

for (const file of ['index.html', 'custom/kitchens.html']) {
  test(file + ': all quote CTAs have stable locations; nested click fires once', t => {
    const h = setup(t, file);
    const anchors = [...h.d.querySelectorAll('a[href="#contact"], a[href="#quote"]')];
    assert.equal(anchors.length, file === 'index.html' ? 6 : 4);
    for (const a of anchors) {
      assert.ok(a.dataset.bwfQuoteCta);
      h.click(a.querySelector('span') || a);
    }
    assert.equal(h.event('bwf_quote_click').length, anchors.length);
    assert.equal(h.event('generate_lead').length, 0);
  });

  test(file + ': form view requires visible first field; once per page, including mobile', t => {
    const h = setup(t, file);
    assert.equal(h.event('bwf_form_view').length, 0);
    h.show({ opacityZero: true });
    assert.equal(h.event('bwf_form_view').length, 0);
    h.show({ height: 500 }); h.show();
    assert.equal(h.event('bwf_form_view').length, 1);
  });

  test(file + ': view fallback without IntersectionObserver', t => {
    const h = setup(t, file, { noObserver: true });
    h.show(); h.show();
    assert.equal(h.event('bwf_form_view').length, 1);
  });

  test(file + ': focus is not a start; meaningful input starts once', t => {
    const h = setup(t, file);
    h.form.dispatchEvent(new h.w.FocusEvent('focusin', { bubbles: true }));
    h.fill('bot-field', 'bot');
    h.fill('first-name', ' ');
    assert.equal(h.event('bwf_form_start').length, 0);
    h.fill('first-name', 'PrivateFirst'); h.fill('last-name', 'PrivateLast');
    assert.equal(h.event('bwf_form_start').length, 1);
    assert.equal(h.event('form_start').length, 0);
  });

  test(file + ': native validation is measured even when submit never fires', t => {
    const h = setup(t, file);
    h.form.requestSubmit();
    const count = h.event('bwf_form_error').length;
    assert.ok(count > 0);
    h.form.requestSubmit();
    assert.equal(h.event('bwf_form_error').length, count);
    assert.equal(h.posts.length, 0);
    assert.equal(h.event('generate_lead').length, 0);
    h.fill('email', 'invalid-address');
    h.form.requestSubmit();
    assert.ok(h.event('bwf_form_error').some(e => e[2].error_code === 'type_mismatch'));
  });

  test(file + ': one successful POST -> one GA4-only lead; no direct Ads conversion or PII', async t => {
    const h = setup(t, file);
    h.show(); h.valid(); h.submit();
    await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.posts[0][0], '/');
    const payload = new URLSearchParams(h.posts[0][1].body);
    assert.equal(payload.get('form-name'), h.form.name);
    assert.equal(payload.get('email'), 'private-person@example.invalid');
    assert.match(payload.get('subject'), /PrivateFirst PrivateLast/);
    assert.equal(h.event('bwf_form_submit').length, 1);
    assert.equal(h.event('generate_lead').length, 1);
    assert.equal(h.event('conversion').length, 0);
    assert.equal(h.event('form_submit').length, 0);
    for (const e of h.events) assert.equal(e[2].send_to, 'G-XZQ389ZLRW');
    const serialized = JSON.stringify(h.events);
    for (const secret of ['PrivateFirst', 'PrivateLast', 'private-person', 'Private project', 'PrivateCity', '+15555550123']) {
      assert.ok(!serialized.includes(secret));
    }
    assert.equal(h.form.style.display, 'none');
    assert.ok(h.d.getElementById('fok').classList.contains('show'));
    assert.ok(h.w.localStorage.getItem('bwf_lead_sent'));
    h.submit(); await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.event('generate_lead').length, 1);
  });

  test(file + ': double submission while pending cannot create a second POST', async t => {
    let finish;
    const h = setup(t, file, { respond: () => new Promise(resolve => { finish = resolve; }) });
    h.valid(); h.submit(); h.submit();
    await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.event('generate_lead').length, 0);
    assert.equal(h.event('form_resubmit_blocked')[0][2].block_reason, 'in_flight');
    finish({ ok: true, status: 200 }); await tick();
    assert.equal(h.event('generate_lead').length, 1);
  });

  for (const kind of ['http', 'network']) {
    test(file + ': ' + kind + ' failure emits error, no lead, and permits retry', async t => {
      const h = setup(t, file, { respond: () => kind === 'http' ?
        Promise.resolve({ ok: false, status: 500 }) : Promise.reject(new Error('private error text')) });
      h.valid(); h.submit(); await tick();
      assert.equal(h.event('generate_lead').length, 0);
      assert.equal(h.event('bwf_form_error').at(-1)[2].error_type, kind);
      assert.equal(h.form.querySelector('.fsub').disabled, false);
      assert.equal(h.w.localStorage.getItem('bwf_lead_sent'), null);
      assert.equal(h.alerts.length, 1);
      h.setResponse(() => Promise.resolve({ ok: true, status: 200 }));
      h.submit(); await tick();
      assert.equal(h.posts.length, 2);
      assert.equal(h.event('generate_lead').length, 1);
      assert.equal(h.event('bwf_form_submit').at(-1)[2].attempt_number, 2);
    });
  }

  test(file + ': reload/shared 24h lock hides form without replaying a lead', async t => {
    const h = setup(t, file, { timestamp: Date.now() });
    assert.equal(h.form.style.display, 'none');
    assert.equal(h.event('form_resubmit_blocked')[0][2].block_reason, 'recent_submission_on_load');
    h.show(); h.valid(); h.submit(); await tick();
    assert.equal(h.posts.length, 0);
    assert.equal(h.event('generate_lead').length, 0);
    assert.equal(h.event('bwf_form_view').length, 0);
    assert.equal(h.event('bwf_form_start').length, 0);
  });

  test(file + ': 24h lock expires', async t => {
    const h = setup(t, file, { timestamp: Date.now() - 25 * 60 * 60 * 1000 });
    assert.notEqual(h.form.style.display, 'none');
    h.valid(); h.submit(); await tick();
    assert.equal(h.event('generate_lead').length, 1);
  });

  test(file + ': cached page synchronizes a newer shared lock on pageshow without replaying a lead', t => {
    const h = setup(t, file);
    // Model another page having submitted while this document was in BFCache.
    h.w.localStorage.setItem('bwf_lead_sent', String(Date.now()));
    h.w.dispatchEvent(new h.w.PageTransitionEvent('pageshow', { persisted: true }));
    h.w.dispatchEvent(new h.w.PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal(h.form.style.display, 'none');
    assert.equal(h.event('form_resubmit_blocked').length, 1);
    assert.equal(h.event('form_resubmit_blocked')[0][2].block_reason, 'recent_submission_on_restore');
    assert.equal(h.event('generate_lead').length, 0);
    assert.equal(h.posts.length, 0);
  });

  test(file + ': history restore preserves the pending request guard', async t => {
    let finish;
    const h = setup(t, file, { respond: () => new Promise(resolve => { finish = resolve; }) });
    h.valid(); h.submit(); await tick();
    h.w.dispatchEvent(new h.w.PageTransitionEvent('pageshow', { persisted: true }));
    h.submit(); await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.event('generate_lead').length, 0);
    finish({ ok: true, status: 200 }); await tick();
    h.w.dispatchEvent(new h.w.PageTransitionEvent('pageshow', { persisted: true }));
    h.submit(); await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.event('generate_lead').length, 1);
  });

  test(file + ': honeypot never posts or records a successful lead', async t => {
    const h = setup(t, file);
    h.valid(); h.fill('bot-field', 'bot'); h.submit(); await tick();
    assert.equal(h.posts.length, 0);
    assert.equal(h.event('generate_lead').length, 0);
    assert.equal(h.event('bwf_form_submit').length, 0);
  });

  for (const options of [{ noGtag: true }, { gtagThrows: true }, { storageDenied: true }]) {
    test(file + ': submission survives ' + Object.keys(options)[0], async t => {
      const h = setup(t, file, options);
      h.valid(); h.submit(); await tick(); h.submit(); await tick();
      assert.equal(h.posts.length, 1);
      assert.equal(h.form.style.display, 'none');
      assert.equal(h.alerts.length, 0);
    });
  }

  test(file + ': loading module twice does not attach another handler', async t => {
    const h = setup(t, file);
    h.w.eval(code);
    h.valid(); h.submit(); await tick();
    assert.equal(h.posts.length, 1);
    assert.equal(h.event('generate_lead').length, 1);
    assert.equal(h.event('bwf_form_start').length, 1);
  });
}

for (const file of ['faq.html', 'reviews.html']) {
  test(file + ': quote CTA works without a form and identifies its source page', t => {
    const h = setup(t, file);
    const anchors = h.d.querySelectorAll('[data-bwf-quote-cta]');
    assert.equal(anchors.length, file === 'faq.html' ? 1 : 2);
    for (const a of anchors) h.click(a);
    assert.equal(h.event('bwf_quote_click').length, anchors.length);
    assert.equal(h.event('bwf_quote_click')[0][2].page_type, file.replace('.html', ''));
    assert.equal(h.event('generate_lead').length, 0);
  });
}

test('all four service groups map to fixed analytics values', t => {
  const h = setup(t, 'index.html');
  const expected = {
    'Custom Millwork': 'custom_millwork',
    'Custom Kitchen Cabinets': 'custom_cabinetry',
    'Cabinetry, Built-ins & Closets': 'custom_cabinetry',
    'Antique Furniture Restoration': 'antique_restoration',
    'Fine Upholstery': 'fine_upholstery'
  };
  for (const [selection, group] of Object.entries(expected)) {
    h.fill('project-type', selection, 'change');
    h.click(h.d.querySelector('[data-bwf-quote-cta="hero"]'));
    assert.equal(h.event('bwf_quote_click').at(-1)[2].service_group, group);
  }
});

test('existing contact clicks remain instrumented once', t => {
  const h = setup(t, 'index.html');
  for (const [selector, event] of [['a[href^="tel:"]', 'phone_click'], ['a[href*="wa.me/"]', 'whatsapp_click'], ['a[href^="mailto:"]', 'email_click']]) {
    h.click(h.d.querySelector(selector));
    assert.equal(h.event(event).length, 1);
  }
});

test('all page inline scripts and shared module parse; one handler include per public page', () => {
  new vm.Script(code);
  for (const file of ['index.html', 'custom/kitchens.html', 'faq.html', 'reviews.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.filter(s => s[1].includes('/bwf-funnel-v1.js')).length, 1);
    for (const [, attrs, content] of scripts) {
      if (!attrs.includes('ld+json') && content.trim()) new vm.Script(content, { filename: file });
    }
    assert.ok(!html.includes("gtag('event', 'generate_lead'"));
    assert.ok(!html.includes("gtag('event', 'conversion'"));
  }
  assert.equal((code.match(/send\('generate_lead'/g) || []).length, 1);
});
