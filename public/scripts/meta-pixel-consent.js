// Meta Pixel, gated behind explicit marketing consent.
// No pixel script, cookies, or PageView are loaded until the visitor accepts.
(function () {
  var PIXEL_ID = '1606630404144793';
  var CONSENT_KEY = 'cbtc_marketing_consent';
  var INIT_FLAG = '__cbtcMetaPixelInitialized';
  var VIEW_FLAG = '__cbtcMetaPixelPageViewTracked';

  function getConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {}
  }

  function injectPixel() {
    if (window[INIT_FLAG]) return;
    window[INIT_FLAG] = true;

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', PIXEL_ID);
  }

  function trackPageView() {
    if (window[VIEW_FLAG]) return;
    window[VIEW_FLAG] = true;
    window.fbq('track', 'PageView');
  }

  function enablePixel() {
    injectPixel();
    trackPageView();
  }

  window.cbtcTrackMetaEvent = function (eventName, data) {
    if (getConsent() !== 'granted') return;
    enablePixel();
    window.fbq('track', eventName, data || {});
  };

  function removeBanner() {
    var banner = document.querySelector('[data-marketing-consent-banner]');
    if (banner) banner.remove();
  }

  function openPanel() {
    removeBanner();
    var current = getConsent();
    var banner = document.createElement('section');
    banner.setAttribute('data-marketing-consent-banner', '');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-labelledby', 'marketing-consent-title');
    banner.innerHTML =
      '<div class="cbtc-consent-card">' +
      '<div><p id="marketing-consent-title" class="cbtc-consent-title">Marketing cookies</p>' +
      '<p class="cbtc-consent-copy">We use Meta Pixel only if you allow marketing cookies. It helps us see whether our ads are working. Plausible analytics stays privacy-friendly.</p>' +
      (current === 'granted' ? '<p class="cbtc-consent-state">Current choice: accepted.</p>' : '') +
      (current === 'denied' ? '<p class="cbtc-consent-state">Current choice: rejected.</p>' : '') +
      '</div>' +
      '<div class="cbtc-consent-actions">' +
      '<button type="button" data-marketing-accept>Accept marketing</button>' +
      '<button type="button" data-marketing-reject>Reject</button>' +
      '</div></div>';
    document.body.appendChild(banner);
    banner.querySelector('[data-marketing-accept]').addEventListener('click', function () {
      setConsent('granted');
      enablePixel();
      removeBanner();
      ensurePrivacyButton();
    });
    banner.querySelector('[data-marketing-reject]').addEventListener('click', function () {
      setConsent('denied');
      removeBanner();
      ensurePrivacyButton();
    });
    banner.querySelector('[data-marketing-accept]').focus();
  }

  function ensurePrivacyButton() {
    if (document.querySelector('[data-marketing-privacy]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-marketing-privacy', '');
    button.textContent = 'Privacy';
    button.addEventListener('click', openPanel);
    document.body.appendChild(button);
  }

  function injectStyles() {
    if (document.querySelector('[data-marketing-consent-styles]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-marketing-consent-styles', '');
    style.textContent =
      '[data-marketing-consent-banner]{position:fixed;z-index:9999;inset:auto 16px 16px 16px;display:flex;justify-content:center;pointer-events:none}' +
      '.cbtc-consent-card{pointer-events:auto;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;width:min(760px,100%);border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgb(9,19,15);color:rgb(246,241,229);box-shadow:0 18px 42px rgba(0,0,0,.28);padding:16px;font-family:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.cbtc-consent-title{margin:0 0 4px;font-family:"Archivo",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:.78rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:rgb(214,166,64)}' +
      '.cbtc-consent-copy,.cbtc-consent-state{margin:0;max-width:58ch;font-size:.95rem;line-height:1.42;color:rgba(246,241,229,.82)}' +
      '.cbtc-consent-state{margin-top:6px;color:rgba(246,241,229,.66);font-weight:700}' +
      '.cbtc-consent-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}' +
      '.cbtc-consent-actions button,[data-marketing-privacy]{min-height:40px;border:0;border-radius:8px;padding:0 14px;font:800 .92rem/1 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}' +
      '.cbtc-consent-actions [data-marketing-accept]{background:oklch(57.2% .128 37.49);color:rgb(246,241,229)}' +
      '.cbtc-consent-actions [data-marketing-reject]{background:rgba(255,255,255,.08);color:rgb(246,241,229);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}' +
      '[data-marketing-privacy]{position:fixed;z-index:9998;left:16px;bottom:16px;background:rgba(9,19,15,.86);color:rgb(246,241,229);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);backdrop-filter:blur(6px)}' +
      '.cbtc-consent-actions button:focus-visible,[data-marketing-privacy]:focus-visible{outline:2px solid rgb(214,166,64);outline-offset:3px}' +
      '@media (max-width:640px){.cbtc-consent-card{grid-template-columns:1fr}.cbtc-consent-actions{justify-content:stretch}.cbtc-consent-actions button{flex:1 1 140px}}';
    document.head.appendChild(style);
  }

  function boot() {
    injectStyles();
    var consent = getConsent();
    if (consent === 'granted') enablePixel();
    if (!consent) openPanel();
    ensurePrivacyButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
