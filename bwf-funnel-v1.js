/* BWF P0: one owner for quote submission and GA4 funnel events. */
(function () {
  'use strict';
  var form = document.getElementById('qform');
  var ok = document.getElementById('fok');
  if (document.documentElement.dataset.bwfFunnelBound) return;
  document.documentElement.dataset.bwfFunnelBound = 'true';

  var formId = form ? form.getAttribute('name') : 'bwf-quote';
  var kitchen = formId === 'bwf-kitchen-quote';
  var page = form ? (kitchen ? 'kitchens' : 'home') :
    (document.currentScript && document.currentScript.getAttribute('data-bwf-page')) || 'other';
  var key = 'bwf_lead_sent';
  var windowMs = 24 * 60 * 60 * 1000;
  var sending = false;
  var confirmed = false;
  var started = false;
  var viewed = false;
  var attempts = 0;
  var invalidFields = {};
  var fields = ['first-name', 'last-name', 'email', 'phone', 'project-type', 'city', 'message'];
  var btn = form && form.querySelector('.fsub');
  var btnText = btn && btn.querySelector('span');
  var originalButtonText = btnText && btnText.textContent;
  var serviceGroups = {
    'Custom Millwork': 'custom_millwork',
    'Custom Kitchen Cabinets': 'custom_cabinetry',
    'Cabinetry, Built-ins & Closets': 'custom_cabinetry',
    'Antique Furniture Restoration': 'antique_restoration',
    'Fine Upholstery': 'fine_upholstery',
    'Commercial / Trade': 'commercial_trade',
    'Other': 'other',
    'New Custom Kitchen': 'custom_cabinetry',
    'Kitchen Cabinet Replacement': 'custom_cabinetry',
    'Kitchen Island / Built-ins': 'custom_cabinetry',
    'Other Cabinetry': 'custom_cabinetry'
  };

  function send(name, extra) {
    // Analytics must never interrupt submission, confirmation or the duplicate guard.
    try {
      if (typeof window.gtag !== 'function') return;
      var selected = form && form.elements.namedItem('project-type');
      var params = {
        send_to: 'G-XZQ389ZLRW',
        transport_type: 'beacon',
        form_id: formId,
        page_type: page,
        service_group: serviceGroups[selected && selected.value] || 'unspecified',
        funnel_version: 'p0_v1'
      };
      Object.keys(extra || {}).forEach(function (key) { params[key] = extra[key]; });
      window.gtag('event', name, params);
    } catch (_) {}
  }

  function sentRecently() {
    if (confirmed) return true;
    try {
      var at = parseInt(localStorage.getItem(key), 10);
      return at > 0 && (Date.now() - at) < windowMs;
    } catch (_) { return false; }
  }

  function showConfirmation() {
    form.style.display = 'none';
    ok.classList.add('show');
  }

  function blocked(reason) {
    send('form_resubmit_blocked', { block_reason: reason });
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var cta = a.getAttribute('data-bwf-quote-cta');
    if (cta) send('bwf_quote_click', { cta_location: cta });

    // Preserve existing contact-click events and their business contact targets.
    var href = a.getAttribute('href') || '';
    var name, target;
    if (href.indexOf('tel:') === 0) { name = 'phone_click'; target = href.slice(4); }
    else if (href.indexOf('wa.me/') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      name = 'whatsapp_click'; target = (href.match(/wa\.me\/(\d+)/) || ['', ''])[1];
    } else if (href.indexOf('mailto:') === 0) { name = 'email_click'; target = href.slice(7).split('?')[0]; }
    if (name) {
      var section = a.closest('[id]');
      send(name, { location: section ? section.id : 'page', target: target, page: page });
    }
  }, true);

  if (!form || !ok) return;

  // Preserve the existing, shared 24-hour lock, including reloads and both pages.
  if (sentRecently()) {
    var p = ok.querySelector('p');
    if (p) p.textContent = 'We already have your request from today. Need to add something? Call or WhatsApp us.';
    showConfirmation();
    blocked('recent_submission_on_load');
  }

  // Observe the first field, not the entire tall form (important on mobile).
  var firstField = form.querySelector('[name="first-name"]');
  function checkView() {
    if (viewed || document.hidden || form.style.display === 'none' || !firstField) return;
    var rect = firstField.getBoundingClientRect();
    var visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (!rect.height || visibleHeight < rect.height / 2 || rect.right <= 0 || rect.left >= window.innerWidth) return;
    for (var el = firstField; el; el = el.parentElement) {
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
    }
    viewed = true;
    send('bwf_form_view');
    if (viewObserver) viewObserver.disconnect();
    if (revealObserver) revealObserver.disconnect();
    window.removeEventListener('scroll', checkView);
    window.removeEventListener('resize', checkView);
    document.removeEventListener('visibilitychange', checkView);
    document.removeEventListener('transitionend', checkView, true);
    document.removeEventListener('animationend', checkView, true);
  }
  var viewObserver;
  var revealObserver;
  if (firstField && !sentRecently()) {
    if ('IntersectionObserver' in window) {
      viewObserver = new IntersectionObserver(checkView, { threshold: [0, 0.5, 1] });
      viewObserver.observe(firstField);
    }
    // Reveal animations can change opacity without changing intersection geometry.
    if ('MutationObserver' in window) {
      revealObserver = new MutationObserver(checkView);
      for (var parent = firstField; parent; parent = parent.parentElement) {
        revealObserver.observe(parent, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    }
    window.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('resize', checkView);
    document.addEventListener('visibilitychange', checkView);
    document.addEventListener('transitionend', checkView, true);
    document.addEventListener('animationend', checkView, true);
    checkView();
  }

  function editable(target) { return target && fields.indexOf(target.name) !== -1; }
  function recordInput(e) {
    if (!editable(e.target)) return;
    delete invalidFields[e.target.name];
    if (started || sentRecently() || !String(e.target.value).trim()) return;
    checkView();
    started = true;
    // Keep the existing custom name; do not manually duplicate GA4 form_start.
    send('bwf_form_start', { field_name: e.target.name });
  }
  form.addEventListener('input', recordInput);
  form.addEventListener('change', recordInput);

  // Native validation can stop submit before the submit listener runs.
  form.addEventListener('invalid', function (e) {
    var field = e.target;
    if (!editable(field)) return;
    var validity = field.validity;
    var code = validity.valueMissing ? 'required' : validity.typeMismatch ? 'type_mismatch' :
      validity.patternMismatch ? 'pattern_mismatch' : 'invalid';
    if (invalidFields[field.name] === code) return;
    invalidFields[field.name] = code;
    send('bwf_form_error', { error_type: 'validation', error_code: code, field_name: field.name });
  }, true);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) { blocked('in_flight'); return; }
    if (sentRecently()) { showConfirmation(); blocked('recent_submission'); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var honey = form.elements.namedItem('bot-field');
    if (honey && honey.value.trim()) { showConfirmation(); return; }

    sending = true;
    attempts += 1;
    btn.disabled = true;
    btnText.textContent = 'Sending...';
    send('bwf_form_submit', { attempt_number: attempts });

    // Keep the existing notification subject; no customer text enters analytics.
    var subject = form.querySelector('#bwf-subject');
    function value(name) { var field = form.elements.namedItem(name); return field ? field.value : ''; }
    if (subject) {
      var project = value('project-type');
      var city = value('city');
      subject.value = (kitchen ? 'Kitchen quote — ' : 'Quote — ') +
        (value('first-name') + ' ' + value('last-name')).trim() +
        (project ? ' — ' + project : '') + (city ? ' (' + city + ')' : '');
    }

    var httpStatus = 0;
    Promise.resolve().then(function () {
      return fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
    }).then(function (response) {
      if (!response.ok) { httpStatus = response.status; throw new Error('form_http_error'); }
      // Lock before analytics; storage/gtag failures must not invite a second POST.
      confirmed = true;
      sending = false;
      try { localStorage.setItem(key, String(Date.now())); } catch (_) {}
      showConfirmation();
      send('generate_lead', {
        event_category: 'contact_form',
        event_label: kitchen ? 'bwf_kitchen_landing' : 'bwf_quote_request',
        value: 1
      });
    }).catch(function () {
      if (confirmed) return;
      sending = false;
      btn.disabled = false;
      btnText.textContent = originalButtonText;
      send('bwf_form_error', {
        error_type: httpStatus ? 'http' : 'network',
        error_code: httpStatus ? 'http_' + httpStatus : 'request_failed',
        attempt_number: attempts
      });
      alert('Error sending. Please call (689) 250-1209 or email brandtwoodfinishing@gmail.com');
    });
  });
})();
