// Intercepts site forms (data-form="waitlist" | "apply" | "routes"), POSTs JSON to /api/apply.
// All inputs carry name="" attributes (see scripts/form-v2.mjs).
(function () {
  var SUCCESS = {
    apply: {
      heading: 'Application received',
      body: 'A real reply from Monika or Anna will reach you within 48 hours.',
      steps: [
        'We read your running notes and check whether the camp fits in both directions.',
        'If it is a yes, we will explain why and how to hold the spot.',
        'For now, there is nothing to pay and nothing else to fill in.',
      ],
    },
    waitlist: 'You’re on the winter waitlist. We’ll email you the dates before applications open. There’s nothing to pay or book yet.',
    routes: 'Request received. We’ll email you the route information.',
  };

  function buildApplySuccess() {
    var region = document.createElement('section');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-labelledby', 'apply-success-heading');
    region.setAttribute('tabindex', '-1');
    region.className = 'cbtc-success';

    var heading = document.createElement('h3');
    heading.id = 'apply-success-heading';
    heading.textContent = SUCCESS.apply.heading;

    var body = document.createElement('p');
    body.textContent = SUCCESS.apply.body;

    var list = document.createElement('ol');
    SUCCESS.apply.steps.forEach(function (step) {
      var item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    });

    region.appendChild(heading);
    region.appendChild(body);
    region.appendChild(list);
    return region;
  }

  function buildInlineSuccess(formName) {
    var msg = document.createElement('p');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    msg.className = 'cbtc-inline-success';
    msg.textContent = SUCCESS[formName] || 'Sent.';
    return msg;
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.getAttribute('data-submitting') === 'true') return;
      form.setAttribute('data-submitting', 'true');
      var formName = form.getAttribute('data-form');
      var button = form.querySelector('button, [type="submit"]');
      var fields = {};
      form.querySelectorAll('input, textarea').forEach(function (el) {
        if (el.name === 'camps') { if (!fields.camps) fields.camps = []; if (el.checked) fields.camps.push(el.value); }
        else if (el.name && (el.type !== 'checkbox' || el.checked)) fields[el.name] = el.value;
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
          if (!r.ok || !r.data || r.data.ok !== true || (formName === 'interest' && typeof r.data.preferenceSummary !== 'string')) throw new Error((r.data && r.data.error) || 'failed');
          var success = formName === 'apply' ? buildApplySuccess() : buildInlineSuccess(formName);
          if (formName === 'interest') {
            var summary = r.data.preferenceSummary;
            var message = summary === 'Month preference not specified'
              ? 'We’ll email you general camp updates.'
              : summary === 'Later camps only (none of the listed months)'
                ? 'We’ll email you the dates and details for later camps.'
                : 'We’ll email you the dates and details for ' + summary + '.';
            success.textContent = 'You’re on the list. ' + message + ' No payment or commitment. Please wait for your place and dates to be confirmed before booking travel.';
            success.setAttribute('tabindex', '-1');
          }
          var grid = formName === 'interest' ? form : form.querySelector('div') || form;
          grid.replaceChildren(success);
          if (formName === 'apply' || formName === 'interest') {
            form.className += ' cbtc-form--success';
            try {
              success.focus({ preventScroll: true });
            } catch (_) {
              try { success.focus(); } catch (focusError) {}
            }
          }
          try {
            if (window.plausible) plausible(formName === 'apply' ? 'Apply Submitted' : formName === 'interest' ? 'Interest Submitted' : formName === 'waitlist' ? 'Waitlist Submitted' : 'Routes Submitted');
          } catch (analyticsError) {}
          try {
            if (
              (formName === 'apply' || formName === 'waitlist' || formName === 'interest') &&
              !fields.website &&
              form.getAttribute('data-meta-lead-tracked') !== 'true' &&
              window.cbtcTrackMetaEvent
            ) {
              form.setAttribute('data-meta-lead-tracked', 'true');
              window.cbtcTrackMetaEvent('Lead');
            }
          } catch (analyticsError) {}
        })
        .catch(function (err) {
          form.removeAttribute('data-submitting');
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
              : 'We couldn’t send your details. Please try again.';
          form.appendChild(p);
        });
    });
  });
})();
