// Generates an isolated, disposable QA copy. Does not deploy or edit site sources.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sourceCommit = 'ab61141c387fc6af9f533896c68b0a2fb693aa98';
const measurement = 'G-21MY7L42JP';
const expected = {
  'index.html': 'be57569885c2dfaee577560916911cb429316865',
  'custom/kitchens.html': '7b67361e44366a4c66ab8cfee984b0b0e6d28887',
  'faq.html': 'b73c7ced771f7c8a2d0c1a18735629af25e91c67',
  'reviews.html': '7d722fa1d83b53e6d688fe470981505d439458c8',
  'bwf-funnel-v1.js': 'e2d1bd799049293868b720950f6cce19b3ab83f3'
};
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://tagassistant.google.com https://cdnjs.cloudflare.com",
  "connect-src https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.google.com/g/collect https://www.googletagmanager.com https://tagassistant.google.com",
  "img-src 'self' data: https://d2xsxph8kpxj0f.cloudfront.net https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://ssl.gstatic.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://tagmanager.google.com",
  "font-src https://fonts.gstatic.com data:",
  "frame-src https://tagassistant.google.com https://www.googletagmanager.com",
  "form-action 'none'", "object-src 'none'", "base-uri 'none'"
].join('; ');
const out = path.resolve(process.argv[2] || '/tmp/bwf-p0-qa-preview');
assert.ok(!out.startsWith(root + path.sep) && out !== root, 'Output must be outside repository');
assert.ok(!fs.existsSync(out), 'Choose an unused output directory; never overwrite a deployment');
fs.mkdirSync(out, { recursive: true });
const write = (name, content) => {
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content);
};
for (const [name, hash] of Object.entries(expected)) {
  const bytes = fs.readFileSync(path.join(root, name));
  assert.equal(crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'), hash, name);
  let text = bytes.toString('utf8').replaceAll('G-XZQ389ZLRW', measurement);
  if (name.endsWith('.html')) {
    text = text.replace(/<!-- Google Ads Conversion Tracking[^]*?<\/script>/g, '')
      .replace(/\sdata-netlify(?:-honeypot)?=["'][^"']*["']/g, '')
      .replace(/<meta name="robots"[^>]*>/g, '')
      .replace(/<link rel="canonical"[^>]*>/g, '')
      .replace(/<meta property="og:url"[^>]*>/g, '')
      .replace(/page_location:\s*'[^']*'/g, 'page_location: window.location.origin + window.location.pathname')
      .replace(/page_location:\s*window\.location\.href/g, 'page_location: window.location.origin + window.location.pathname')
      .replace(/(['"])(\/?[A-Za-z0-9_/-]+\.(?:webp|png|jpe?g))\1/g, '"/qa-placeholder.svg"')
      .replace(/https?:\/\/(?:www\.)?brandtwf\.com(?=[/'"])/g, '');
    text = text.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<script src="/qa-guard.js"></script>');
    text = text.replace("gtag('js', new Date());", "gtag('consent', 'default', {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});\n  gtag('set', {debug_mode:true,allow_google_signals:false,allow_ad_personalization_signals:false});\n  gtag('js', new Date());")
      .replace(`gtag('config', '${measurement}', {`, `gtag('config', '${measurement}', {debug_mode:true,`)
      .replace(`gtag('config', '${measurement}');`, `gtag('config', '${measurement}', {debug_mode:true});`);
  } else text = text.replace(`send_to: '${measurement}',`, `send_to: '${measurement}', debug_mode: true,`);
  assert.ok(!/G-XZQ389ZLRW|AW-\d+|data-netlify|https?:\/\/(?:www\.)?brandtwf\.com/.test(text), `Production reference in ${name}`);
  write(name, text);
}
write('qa-guard.js', fs.readFileSync(path.join(root, 'scripts/qa-preview-guard.js')));
write('qa-placeholder.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#191919"/><text x="400" y="300" text-anchor="middle" fill="#aaa" font-family="sans-serif">Imagem omitida na cópia de teste</text></svg>');
write('robots.txt', 'User-agent: *\nDisallow: /\n');
write('_headers', '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: ' + csp + '\n');
write('_redirects', '/custom-kitchens /custom/kitchens.html 302\n/custom/kitchens /custom/kitchens.html 200\n/faq /faq.html 200\n/reviews /reviews.html 200\n');
write('QA-MANIFEST.json', JSON.stringify({ sourceCommit, property:'563205212', measurement, forms:'client-only mock; no real POST', localImages:'placeholders', sources:expected, csp, deployed:false }, null, 2) + '\n');
console.log(JSON.stringify({ output:out, measurement, sourceCommit, deployed:false }));
