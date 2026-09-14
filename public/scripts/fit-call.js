// Reveals the optional Monika fit-call CTA only when a real booking URL is configured.
(function () {
  var cta = document.querySelector && document.querySelector('[data-fit-call-cta]');
  var link = cta && cta.querySelector('[data-fit-call-link]');
  if (!cta || !link) return;

  function usableUrl(value) {
    if (!value || typeof value !== 'string') return '';
    try {
      var url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  fetch('/api/site-config', { headers: { Accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('site config unavailable');
      return res.json();
    })
    .then(function (config) {
      var href = usableUrl(config && config.fitCallUrl);
      if (!href) return;
      link.href = href;
      cta.hidden = false;
    })
    .catch(function () {
      // Optional CTA stays hidden when configuration is absent or unavailable.
    });
})();
