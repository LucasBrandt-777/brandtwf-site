// Offline integration check: blocks all Google traffic and all real submissions.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'bwf-preview-check-'));
const out = path.join(parent, 'site');
execFileSync(process.execPath, [path.join(root, 'scripts/build-qa-preview.cjs'), out]);
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'QA-MANIFEST.json')));
const hits = [];
const log = {started:new Date().toISOString(), transport:'OFFLINE — all external requests intercepted', checks:[], errors:[]};
const server = http.createServer((req, res) => {
  hits.push({method:req.method,path:req.url});
  if (req.method !== 'GET') {res.writeHead(405);res.end();return;}
  const url = new URL(req.url, 'http://localhost');
  let name = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!path.extname(name)) name += '.html';
  const file = path.resolve(out, '.' + name);
  if (!file.startsWith(out + path.sep) || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml'};
  res.writeHead(200, {'Content-Type':types[path.extname(file)]||'text/plain','Content-Security-Policy':manifest.csp,'Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
  for (const file of ['index.html','custom/kitchens.html']) {
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    const page=await context.newPage();
    page.on('dialog',d=>d.dismiss());
    page.on('pageerror',e=>log.errors.push({file,message:e.message}));
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());
      if(u.origin===origin)return route.continue();
      if(u.hostname==='cdnjs.cloudflare.com' && /\/(gsap|ScrollTrigger)\.min\.js$/.test(u.pathname))return route.fulfill({path:require.resolve('gsap/dist/'+path.basename(u.pathname)),contentType:'text/javascript'});
      if(u.hostname==='www.googletagmanager.com')return route.fulfill({body:'/* offline QA: no analytics transport */',contentType:'text/javascript'});
      return route.abort('blockedbyclient');
    });
    await page.goto(origin+'/'+file,{waitUntil:'load'});
    const events=name=>page.evaluate(n=>(window.dataLayer||[]).filter(x=>x[0]==='event'&&x[1]===n).map(x=>x[2]),name);
    const config=await page.evaluate(()=>Array.from(window.dataLayer).find(x=>x[0]==='config'));
    assert.equal(config[1],manifest.measurement);
    assert.equal(config[2].debug_mode,true);
    assert.ok(config[2].page_location.startsWith(origin));
    assert.equal(await page.locator('form[data-netlify]').count(),0);
    log.checks.push({file,check:'QA destination, debug, page_location and no Netlify form detection',result:'PASS'});
    await page.locator('[data-bwf-quote-cta="hero"]').click();
    await page.locator('#fn').scrollIntoViewIfNeeded();
    await page.locator('#qa-panel summary').click();
    await page.locator('#qa-fill').click();
    await page.locator('#qa-mode').selectOption('http');
    await page.locator('#qa-panel summary').click();
    await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='bwf_form_error'&&x[2].error_type==='http'));
    assert.equal((await events('generate_lead')).length,0);
    await page.locator('#qa-panel summary').click();
    await page.locator('#qa-mode').selectOption('network');
    await page.locator('#qa-panel summary').click();
    await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='bwf_form_error'&&x[2].error_type==='network'));
    assert.equal((await events('generate_lead')).length,0);
    await page.locator('#qa-panel summary').click();
    await page.locator('#qa-mode').selectOption('success');
    await page.locator('#qa-panel summary').click();
    await page.locator('.fsub').click();
    await page.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='generate_lead'));
    assert.equal((await events('generate_lead')).length,1);
    assert.equal(hits.filter(x=>x.method==='POST').length,0);
    log.checks.push({file,check:'HTTP/network/success mock; one lead and zero server POSTs',result:'PASS'});
    // This also checks the explicit destination guard, independent of test interception.
    const guards=await page.evaluate(async()=>{
      const beacon=navigator.sendBeacon('https://www.google-analytics.com/g/collect?tid=G-NOTQA&en=test','');
      let reason='';try{await fetch('https://brandtwf.com/',{method:'POST',body:'QA_MUST_NEVER_SEND'});}catch(e){reason=e.message;}
      return {beacon,reason};
    });
    assert.deepEqual(guards,{beacon:false,reason:'QA blocked non-analytics fetch'});
    await page.reload({waitUntil:'load'});
    assert.equal(await page.locator('#qform').isVisible(),false);
    assert.equal((await events('generate_lead')).length,0);
    assert.equal((await events('form_resubmit_blocked')).length,1);
    log.checks.push({file,check:'foreign destinations refused; reload blocks another lead',result:'PASS'});
    if(file==='index.html'){
      await page.locator('#qa-panel summary').click();
      await page.locator('#qa-reset').click();
      await page.waitForSelector('#qform');
      await page.locator('#loader').waitFor({state:'hidden'});
      await page.locator('#fn').scrollIntoViewIfNeeded();
      await page.locator('#qa-panel summary').click();
      await page.screenshot({path:path.join(root,'docs/qa/p0-qa-preview-mobile.png')});
    }
    await context.close();
  }
  assert.equal(log.errors.length,0);
  assert.equal(hits.filter(x=>x.method==='POST').length,0);
  log.result='PASS';log.realFormPosts=0;log.googleRequestsForwarded=0;
})().catch(e=>{log.result='FAIL';log.failure=e.stack;process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close();server.close();fs.rmSync(parent,{recursive:true,force:true});
  log.finished=new Date().toISOString();
  fs.writeFileSync(path.join(root,'docs/qa/p0-qa-preview-safety-20261108.json'),JSON.stringify(log,null,2)+'\n');
  console.log(JSON.stringify(log,null,2));
});
