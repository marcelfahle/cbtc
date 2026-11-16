// Future camp updates form: name, where you live and email required; running note optional.
// The server repeats every check; this only gives fast, accessible feedback.
const form = document.querySelector('form[data-form="future-interest"]');
if (form) {
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  const checks = {
    name: v => v.length >= 2 || 'Please tell us your name.',
    from: v => v.length >= 2 || 'Please tell us where you’re from.',
    email: v => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || (v ? 'Please check your email address.' : 'Please enter your email address.'),
  };
  const setError = (key, message) => {
    const input = form.elements[key];
    const slot = document.getElementById(key + '-error');
    if (!input || !slot) return;
    if (message) { input.setAttribute('aria-invalid', 'true'); slot.textContent = message; slot.hidden = false; }
    else { input.removeAttribute('aria-invalid'); slot.textContent = ''; slot.hidden = true; }
  };
  const validate = key => { const ok = checks[key](form.elements[key].value.trim()); setError(key, ok === true ? '' : ok); return ok === true; };
  // Re-check a field once the person has seen an error on it, so it clears as they fix it.
  for (const key of Object.keys(checks)) form.elements[key].addEventListener('input', () => { if (form.elements[key].getAttribute('aria-invalid')) validate(key); });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    form.querySelector('.error')?.remove();
    const invalid = Object.keys(checks).filter(key => !validate(key));
    if (invalid.length) { form.elements[invalid[0]].focus(); return; }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Sending…';
    const value = key => form.elements[key].value.trim();
    try {
      const response = await fetch('/api/apply', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({formName: 'future-interest', pageUrl: location.origin + '/', fields: {name: value('name'), from: value('from'), email: value('email'), running: value('running'), website: form.elements.website.value, consent: true}})});
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw Object.assign(new Error(result.error || ''), {field: result.field});
      const message = document.createElement('p');
      message.className = 'success';
      message.setAttribute('role', 'status');
      message.setAttribute('tabindex', '-1');
      message.textContent = `Thank you, ${value('name').split(/\s+/)[0]}! We'll be in touch when there's news about future camps.`;
      form.replaceChildren(message);
      message.focus();
    } catch (error) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = label;
      if (error.field && checks[error.field] && error.message) { setError(error.field, error.message); form.elements[error.field].focus(); return; }
      const message = document.createElement('p');
      message.className = 'error';
      message.setAttribute('role', 'alert');
      message.textContent = error.message && error.message.length < 120 ? error.message + ' Or email hello@costablancatrailcamp.com.' : 'We couldn’t save your details. Please try again, or email hello@costablancatrailcamp.com.';
      form.append(message);
    }
  });
}
