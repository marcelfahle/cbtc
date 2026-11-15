document.querySelector('form[data-form="future-interest"]')?.addEventListener('submit', async function (event) {
  event.preventDefault();
  const form = this;
  const button = form.querySelector('button');
  if (button.disabled) return;
  form.querySelector('[role="alert"]')?.remove();
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = 'Sending…';
  try {
    const response = await fetch('/api/apply', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({formName: 'future-interest', fields: {email: form.elements.email.value, website: form.elements.website.value, consent: true}})});
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Please try again.');
    const message = document.createElement('p');
    message.className = 'success';
    message.setAttribute('role', 'status');
    message.setAttribute('tabindex', '-1');
    message.textContent = "Thank you! We'll be in touch when there's news about future camps.";
    form.replaceChildren(message);
    message.focus();
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'error';
    message.setAttribute('role', 'alert');
    message.textContent = 'We couldn’t save your email. Please try again, or email hello@costablancatrailcamp.com.';
    form.append(message);
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = 'Keep me posted';
  }
});
