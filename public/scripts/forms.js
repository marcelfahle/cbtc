// Replaces ploy's form island: intercepts both forms, POSTs JSON to /api/apply.
(function () {
  var SUCCESS = {
    apply: 'Application received — you’ll hear from us within 48 hours.',
    routes: 'Sent — the routes are on their way.',
  };

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var formName = form.getAttribute('data-form');
      var button = form.querySelector('button, [type="submit"]');
      var fields = {};
      form.querySelectorAll('input, textarea').forEach(function (el) {
        var key = el.name || (el.type === 'email' ? 'email' : el.placeholder === 'Your name' ? 'name' : el.type);
        fields[key] = el.value;
      });

      var originalText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
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
          form.querySelectorAll('input, textarea').forEach(function (el) {
            if (el.name !== 'website') el.disabled = true;
          });
          if (button) button.textContent = SUCCESS[formName] || 'Sent.';
        })
        .catch(function (err) {
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
          alert(err.message === 'failed' ? 'Something went wrong — please try again.' : err.message);
        });
    });
  });
})();
