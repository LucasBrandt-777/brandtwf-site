/* QA preview only. Never include this file in the production page. */
(function () {
  'use strict';
  if (/^(www\.)?brandtwf\.com$/i.test(location.hostname)) {
    window.stop(); throw new Error('QA preview must never run on production');
  }
  var mode = 'success';
  var posts = 0;
  var nativeFetch = window.fetch.bind(window);
  var nativeBeacon = navigator.sendBeacon.bind(navigator);
  var measurement = 'G-21MY7L42JP';
  function isCollection(url) {
    return ['www.google-analytics.com', 'region1.google-analytics.com', 'analytics.google.com', 'www.google.com'].includes(url.hostname) && url.pathname === '/g/collect' && url.searchParams.get('tid') === measurement;
  }
  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' ? input : input.url, location.href);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (url.origin === location.origin && method === 'POST') {
      posts++;
      var note = document.getElementById('qa-status');
      if (note) note.textContent = posts + ' tentativa(s) simulada(s). Zero pedidos reais.';
      if (mode === 'network') return Promise.reject(new TypeError('QA: simulated network error'));
      return Promise.resolve(new Response('QA ONLY — NO REAL SUBMISSION', {status:mode === 'http' ? 500 : 200}));
    }
    if (isCollection(url) || (url.hostname === 'tagassistant.google.com') || (url.hostname === 'www.googletagmanager.com' && method === 'GET')) return nativeFetch(input, init);
    return Promise.reject(new TypeError('QA blocked non-analytics fetch'));
  };
  navigator.sendBeacon = function (input, data) {
    var url = new URL(input, location.href);
    return isCollection(url) ? nativeBeacon(input, data) : false;
  };
  // Native form submission is forbidden by CSP as a second line of defense.
  // Events remain handled by the existing funnel; this only prevents a fallback POST.
  document.addEventListener('submit', function (event) { event.preventDefault(); }, true);
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var target = new URL(link.href, location.href);
    if (target.origin !== location.origin) event.preventDefault();
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent = '#qa-panel{position:fixed;bottom:8px;left:8px;right:8px;z-index:2147483640;background:#fff5cf;color:#171717;border:2px solid #7d6012;padding:8px 12px;font:13px/1.4 system-ui;box-shadow:0 2px 12px #0005;max-width:680px}#qa-panel summary{cursor:pointer;font-weight:700}#qa-panel button,#qa-panel select{padding:7px;margin:5px 5px 0 0;color:#111;background:#fff;border:1px solid #777;border-radius:3px}';
    document.head.appendChild(style);
    var panel = document.createElement('details'); panel.id = 'qa-panel';
    panel.innerHTML = '<summary>TESTE BWF — nenhum orçamento real será enviado</summary><p>GA4 exclusivo de teste: G-21MY7L42JP. Use somente dados fictícios.</p><label>Resposta simulada <select id="qa-mode"><option value="success">Sucesso HTTP 200</option><option value="http">Erro HTTP 500</option><option value="network">Falha de rede</option></select></label><button id="qa-fill" type="button">Preencher dados fictícios</button><button id="qa-reset" type="button">Reiniciar teste neste navegador</button><p id="qa-status">Zero pedidos reais.</p><p>Imagens locais simplificadas. O bloqueio de 24h usa apenas esta origem de teste.</p>';
    document.body.appendChild(panel);
    document.getElementById('qa-mode').addEventListener('change', function (e) { mode = e.target.value; });
    document.getElementById('qa-fill').addEventListener('click', function () {
      var values = {fn:'BWF QA',ln:'TESTE',em:'qa@example.invalid',mg:'Teste isolado. Nenhum pedido real.'};
      Object.keys(values).forEach(function (id) { var input=document.getElementById(id); if(input){input.value=values[id];input.dispatchEvent(new Event('input',{bubbles:true}));} });
      var select=document.getElementById('pt'); if(select){select.selectedIndex=1;select.dispatchEvent(new Event('change',{bubbles:true}));}
    });
    document.getElementById('qa-reset').addEventListener('click', function () {
      localStorage.removeItem('bwf_lead_sent'); location.reload();
    });
  });
})();
