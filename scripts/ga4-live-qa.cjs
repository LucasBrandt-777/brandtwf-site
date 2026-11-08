// Opt-in QA only. Sends synthetic analytics to the dedicated TEST stream.
// Never use production IDs, user browser profiles or real Netlify submissions.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const measurement = 'G-21MY7L42JP';
const sha = 'ab61141c387fc6af9f533896c68b0a2fb693aa98';
const expected = {
  'index.html': 'be57569885c2dfaee577560916911cb429316865',
  'custom/kitchens.html': '7b67361e44366a4c66ab8cfee984b0b0e6d28887',
  'faq.html': 'b73c7ced771f7c8a2d0c1a18735629af25e91c67',
  'reviews.html': '7d722fa1d83b53e6d688fe470981505d439458c8',
  'bwf-funnel-v1.js': 'e2d1bd799049293868b720950f6cce19b3ab83f3'
};
assert.equal(process.env.BWF_GA4_QA_SEND, 'approved', 'Requires explicit QA-only opt-in');
const output = process.env.BWF_GA4_QA_LOG || path.join(root, 'docs/qa/p0-ga4-live-20261108.json');
const log = { sourceCommit: sha, property: '563205212', stream: '16300023394', measurement,
  started: new Date().toISOString(), formResponses: 'simulated', enhancedMeasurement: false,
  transport: 'Chromium gtag payload relayed through curl with normal TLS validation; not direct-browser TLS',
  events: [], responses: [], blocked: [], scenarios: [], errors: [], browserTransportWarnings: [] };
const save = () => { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(log, null, 2) + '\n'); };
const sources = new Map();
for (const [name, hash] of Object.entries(expected)) {
  const bytes = fs.readFileSync(path.join(root, name));
  const actual = crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  assert.equal(actual, hash, `Source changed: ${name}; review before sending`);
  let content = bytes.toString('utf8').replaceAll('G-XZQ389ZLRW', measurement);
  content = content.replace(/<!-- Google Ads Conversion Tracking[^]*?<\/script>/g, '');
  if (name.endsWith('.html')) {
    content = content.replace("gtag('js', new Date());", `gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'granted'});\n  gtag('set', {debug_mode:true, allow_google_signals:false, allow_ad_personalization_signals:false});\n  gtag('js', new Date());`);
    content = content.replace(`gtag('config', '${measurement}', {`, `gtag('config', '${measurement}', {debug_mode:true, allow_google_signals:false, allow_ad_personalization_signals:false,`)
      .replace(`gtag('config', '${measurement}');`, `gtag('config', '${measurement}', {debug_mode:true, allow_google_signals:false, allow_ad_personalization_signals:false});`);
  } else {
    content = content.replace(`send_to: '${measurement}',`, `send_to: '${measurement}', debug_mode: true,`);
  }
  assert.ok(!/G-XZQ389ZLRW|AW-\d+/.test(content), `Production destination survived in ${name}`);
  sources.set('/' + name, content);
}
const privateValues = ['BWF_QA_PRIVATE_FIRST', 'BWF_QA_PRIVATE_LAST', 'bwf-p0-qa@example.invalid', 'BWF_QA_PRIVATE_MESSAGE'];
const pending = new Set();
function trackedRelay(route) { const task=relay(route); pending.add(task); task.finally(()=>pending.delete(task)); return task; }
// The container's Chromium does not trust its managed egress CA. Use the
// environment HTTPS client, which validates TLS normally. Do not disable TLS,
// install a new trust root, follow redirects or replace gtag-generated payloads.
async function relay(route) {
  const req=route.request(); const u=new URL(req.url());
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bwf-qa-https-'));
  const bodyFile=path.join(dir,'body');
  const args=['--silent','--show-error','--max-time','25','--proto','=https',
    '--output',bodyFile,'--write-out','%{http_code}', '--request', req.method()];
  for(const key of ['content-type','user-agent','origin','referer']) {
    const value=req.headers()[key]; if(value)args.push('--header',key+': '+value);
  }
  const payload=req.postDataBuffer(); if(payload)args.push('--data-binary','@-');
  args.push(req.url());
  try {
    const status=await new Promise((resolve,reject)=>{
      const child=spawn('curl',args,{stdio:['pipe','pipe','pipe']});let out='',err='';
      child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);
      child.on('error',reject);child.on('close',code=>code===0?resolve(Number(out)):reject(new Error('TLS-verified relay failed: '+err.trim())));
      child.stdin.end(payload || undefined);
    });
    assert.ok(status>=200&&status<300,`Unexpected relay HTTP ${status}: ${u.hostname}${u.pathname}`);
    log.responses.push({time:new Date().toISOString(),host:u.hostname,path:u.pathname,status,source:'TLS-verified relay'});save();
    return await route.fulfill({status,body:fs.readFileSync(bodyFile),contentType:u.pathname==='/gtag/js'?'application/javascript':'text/plain',headers:{'access-control-allow-origin':'https://bwf.test','access-control-allow-credentials':'true'}});
  } catch(e) {log.errors.push({transport:e.message,host:u.hostname});save();return route.abort('failed');}
  finally {fs.rmSync(dir,{recursive:true,force:true});}
}
function parseCollect(request) {
  const url = new URL(request.url());
  const base = url.searchParams;
  const lines = (request.postData() || '').split('\n').filter(Boolean);
  return (lines.length ? lines : ['']).map(line => {
    const p = new URLSearchParams(base);
    new URLSearchParams(line).forEach((value, key) => p.set(key, value));
    assert.equal(p.get('tid'), measurement, 'Non-QA analytics destination');
    if(p.get('_dbg')!=='1') {log.guardDebug=log.guardDebug||[];log.guardDebug.push({event:p.get('en'),keys:[...p.keys()],debug:Object.fromEntries([...p].filter(([k])=>/dbg|debug/.test(k)))});}
    // Missing debug is a validation finding, not a reason to block a TEST-only
    // request. Preserve the actual wire payload; do not inject debug at relay.
    const raw = Array.from(p.values()).join(' ');
    for (const value of privateValues) assert.ok(!raw.includes(value), 'Form value leaked to analytics');
    return { time: new Date().toISOString(), event: p.get('en'),
      params: Object.fromEntries(Array.from(p).filter(([k]) => k.startsWith('ep.') || k.startsWith('epn.'))),
      page: p.get('dl'), debug: p.get('_dbg') };
  });
}
let browser;
(async () => {
  browser = await chromium.launch({ headless: true });
  for (const file of ['index.html', 'custom/kitchens.html']) {
    const context = await browser.newContext({ viewport: {width:390,height:844}, serviceWorkers:'block' });
    const page = await context.newPage();
    let mode = 'http';
    let posts = 0;
    const scenario = { file, started: new Date().toISOString(), posts: 0, leads: 0 };
    log.scenarios.push(scenario);
    page.on('dialog', d => d.dismiss());
    page.on('pageerror', e => log.errors.push({file, message:e.message}));
    page.on('requestfailed', r => { if (/google-analytics\.com|googletagmanager\.com/.test(r.url())) log.browserTransportWarnings.push({file, transport:r.failure()?.errorText, host:new URL(r.url()).hostname}); });
    await context.route('**/*', async route => {
      const req=route.request(); const u=new URL(req.url());
      if (u.hostname==='bwf.test') {
        if (req.method()==='POST') {
          assert.equal(u.pathname,'/'); posts++;
          if(mode==='network') return route.abort('failed');
          return route.fulfill({status:mode==='http'?500:200,body:'SIMULATED QA response; no real lead'});
        }
        const pathname = u.pathname==='/' ? '/index.html' : u.pathname;
        if(sources.has(pathname)) return route.fulfill({body:sources.get(pathname),contentType:pathname.endsWith('.js')?'text/javascript':'text/html'});
        if(/\.(webp|png|jpg|jpeg|ico)$/.test(pathname)) return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')});
        return route.fulfill({status:404,body:'QA asset not provided'});
      }
      if(u.hostname==='cdnjs.cloudflare.com' && /\/(gsap|ScrollTrigger)\.min\.js$/.test(u.pathname)) return route.fulfill({path:require.resolve('gsap/dist/'+path.basename(u.pathname)),contentType:'text/javascript'});
      if(u.hostname==='www.googletagmanager.com' && u.pathname==='/gtag/js' && u.searchParams.get('id')===measurement && req.method()==='GET') return trackedRelay(route);
      if(['www.google-analytics.com','region1.google-analytics.com'].includes(u.hostname) && u.pathname==='/g/collect') {
        try { const events=parseCollect(req); log.events.push(...events); save(); return trackedRelay(route); }
        catch(e) { log.errors.push({guard:e.message});save();return route.abort('blockedbyclient'); }
      }
      log.blocked.push({host:u.hostname,path:u.pathname,method:req.method()});
      return route.abort('blockedbyclient');
    });
    await page.goto('https://bwf.test/'+file,{waitUntil:'load'});
    if(process.env.BWF_QA_SMOKE==='1') {
      log.configQueue=await page.evaluate(()=>(window.dataLayer||[]).filter(x=>['config','set','consent'].includes(x[0])).map(x=>Array.from(x)));
      await page.locator('[data-bwf-quote-cta="hero"]').click();
      await page.waitForTimeout(10000);await Promise.all(Array.from(pending));
      log.eventQueue=await page.evaluate(()=>(window.dataLayer||[]).filter(x=>x[0]==='event').map(x=>[x[1],x[2]]));
      log.result='SMOKE ONLY';await context.close();return;
    }
    const event = name => page.evaluate(n=>(window.dataLayer||[]).filter(x=>x[0]==='event'&&x[1]===n).map(x=>x[2]), name);
    await page.locator('[data-bwf-quote-cta="hero"]').click();
    await page.locator('#fn').scrollIntoViewIfNeeded();
    await page.locator('.fsub').click();
    assert.ok((await event('bwf_form_error')).some(x=>x.error_type==='validation'));
    assert.equal(posts,0);
    await page.locator('#fn').fill(privateValues[0]); await page.locator('#ln').fill(privateValues[1]);
    await page.locator('#em').fill(privateValues[2]); await page.locator('#pt').selectOption({index:1});
    await page.locator('#mg').fill(privateValues[3]);
    await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='bwf_form_error'&&x[2].error_type==='http'));
    assert.equal((await event('generate_lead')).length,0);
    mode='network'; await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='bwf_form_error'&&x[2].error_type==='network'));
    assert.equal((await event('generate_lead')).length,0);
    mode='success'; await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='generate_lead'));
    assert.equal((await event('generate_lead')).length,1);
    assert.equal(posts,3); scenario.posts=posts;scenario.leads=1;
    // Allow gtag to flush before navigation; never generate a second submission.
    await page.waitForTimeout(8000);
    await Promise.all(Array.from(pending));
    await page.reload({waitUntil:'load'});
    assert.equal(await page.locator('#qform').isVisible(),false);
    assert.equal((await event('generate_lead')).length,0);
    assert.equal((await event('form_resubmit_blocked')).length,1);
    assert.equal(posts,3);
    await page.waitForTimeout(8000);
    await Promise.all(Array.from(pending));
    scenario.finished=new Date().toISOString(); save();
    await context.close();
  }
  assert.equal(log.events.filter(x=>x.event==='generate_lead').length,2,'Expected two QA leads on the wire');
  for(const name of ['bwf_quote_click','bwf_form_view','bwf_form_start','bwf_form_submit','bwf_form_error','form_resubmit_blocked']) assert.ok(log.events.some(x=>x.event===name), `No outgoing ${name}`);
  assert.ok(log.responses.some(x=>x.path==='/g/collect'&&x.status>=200&&x.status<300),'No successful collect response');
  assert.equal(log.errors.length,0,'See QA log for page/transport errors');
  log.result='PASS: local behavior and TEST-only transport; verify DebugView separately';
})().catch(e=>{log.result='INCOMPLETE';log.failure=e.message;process.exitCode=1;})
  .finally(async()=>{if(browser)await browser.close();log.finished=new Date().toISOString();save();console.log(JSON.stringify({result:log.result,failure:log.failure,events:log.events.length,responses:log.responses,scenarios:log.scenarios,errors:log.errors,log:output},null,2));});
