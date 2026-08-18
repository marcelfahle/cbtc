// Intercepts both forms (data-form="apply" | "routes"), POSTs JSON to /api/apply.
// All inputs carry name="" attributes (see scripts/form-v2.mjs).
(function () {
  var SUCCESS = {
    apply: 'Application received. A real reply from Monika or Anna within 48 hours.',
    routes: 'Sent. The routes are on their way to your inbox.',
  };

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var formName = form.getAttribute('data-form');
      var button = form.querySelector('button, [type="submit"]');
      var fields = {};
      form.querySelectorAll('input, textarea').forEach(function (el) {
        if (el.name) fields[el.name] = el.value;
      });

      var errorEl = form.querySelector('[data-form-error]');
      if (errorEl) errorEl.remove();

      var originalText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Sending…';
      }

      fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formName: formName, pageUrl: location.href, fields: fields }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          if (!r.ok) throw new Error((r.data && r.data.error) || 'failed');
          var msg = document.createElement('p');
          msg.setAttribute('role', 'status');
          msg.className = 'flex min-h-[3rem] items-center justify-center rounded-lg bg-black/30 px-4 text-center text-base font-extrabold text-ploy-text-inverse shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]';
          msg.textContent = SUCCESS[formName] || 'Sent.';
          var grid = form.querySelector('div') || form;
          grid.replaceChildren(msg);
          if (window.plausible) plausible(formName === 'apply' ? 'Apply Submitted' : 'Routes Submitted');
        })
        .catch(function (err) {
          if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.textContent = originalText;
          }
          var p = document.createElement('p');
          p.setAttribute('data-form-error', '');
          p.setAttribute('role', 'alert');
          p.className = 'mt-3 text-center text-sm font-bold text-[rgb(214,166,64)]';
          p.textContent =
            err && err.message && err.message !== 'failed'
              ? err.message
              : 'Something went wrong. Please try again, or email us directly.';
          form.appendChild(p);
        });
    });
  });
})();
