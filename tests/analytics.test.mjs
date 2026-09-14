import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const metaSource = fs.readFileSync(new URL('../public/scripts/meta-pixel-consent.js', import.meta.url), 'utf8');
const formsSource = fs.readFileSync(new URL('../public/scripts/forms.js', import.meta.url), 'utf8');
const fitCallSource = fs.readFileSync(new URL('../public/scripts/fit-call.js', import.meta.url), 'utf8');
const homeHtml = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const runnerLayoutSource = fs.readFileSync(new URL('../src/layouts/RunnerPage.astro', import.meta.url), 'utf8');

function makeElement(tagName, ownerDocument) {
  const listeners = new Map();
  const element = {
    tagName: tagName.toUpperCase(),
    ownerDocument,
    attributes: new Map(),
    children: [],
    style: {},
    parentNode: null,
    textContent: '',
    className: '',
    disabled: false,
    value: '',
    name: '',
    type: '',
    setAttribute(name, value = '') {
      this.attributes.set(name, String(value));
      if (name === 'name') this.name = String(value);
      if (name === 'type') this.type = String(value);
    },
    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
      if (ownerDocument) ownerDocument._elements = ownerDocument._elements.filter((child) => child !== this);
      this.parentNode = null;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    dispatch(type, event = {}) {
      const handler = listeners.get(type);
      if (handler) handler(event);
    },
    focus() {
      this.focused = true;
    },
    querySelector(selector) {
      return findElement(this.children, selector);
    },
    querySelectorAll(selector) {
      return findElements(this.children, selector);
    },
    replaceChildren(...children) {
      this.children = [];
      children.forEach((child) => this.appendChild(child));
    },
  };

  Object.defineProperty(element, 'innerHTML', {
    set(html) {
      this._innerHTML = html;
      this.children = [];
      if (html.includes('data-marketing-accept')) {
        const accept = makeElement('button', ownerDocument);
        accept.setAttribute('data-marketing-accept', '');
        const reject = makeElement('button', ownerDocument);
        reject.setAttribute('data-marketing-reject', '');
        this.appendChild(accept);
        this.appendChild(reject);
        ownerDocument._elements.push(accept, reject);
      }
    },
    get() {
      return this._innerHTML || '';
    },
  });

  return element;
}

function matches(element, selector) {
  if (selector === 'button, [type="submit"]') {
    return element.tagName === 'BUTTON' || element.getAttribute('type') === 'submit';
  }
  if (selector === 'input, textarea') return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  if (selector === 'div') return element.tagName === 'DIV';
  const attr = selector.match(/^\[([^\]]+)\]$/)?.[1];
  if (attr) return element.attributes.has(attr);
  const attrEquals = selector.match(/^(\w+)\[([^=]+)="([^"]+)"\]$/);
  if (attrEquals) {
    return element.tagName === attrEquals[1].toUpperCase() && element.getAttribute(attrEquals[2]) === attrEquals[3];
  }
  return false;
}

function findElement(elements, selector) {
  return findElements(elements, selector)[0] || null;
}

function findElements(elements, selector) {
  const found = [];
  const visit = (element) => {
    if (matches(element, selector)) found.push(element);
    element.children.forEach(visit);
  };
  elements.forEach(visit);
  return found;
}

function createMetaContext(consent) {
  const storage = new Map(consent ? [['cbtc_marketing_consent', consent]] : []);
  const document = {
    readyState: 'complete',
    _elements: [],
    createElement(tagName) {
      const element = makeElement(tagName, document);
      document._elements.push(element);
      return element;
    },
    querySelector(selector) {
      return findElement(document._elements, selector);
    },
    getElementsByTagName(tagName) {
      return tagName === 'script' ? [document._firstScript] : [];
    },
  };
  document.head = makeElement('head', document);
  document.body = makeElement('body', document);
  document._firstScript = makeElement('script', document);
  document._scriptParent = makeElement('div', document);
  document._scriptParent.insertBefore = (element) => {
    element.parentNode = document._scriptParent;
    document._scriptParent.children.push(element);
    if (!document._elements.includes(element)) document._elements.push(element);
    return element;
  };
  document._firstScript.parentNode = document._scriptParent;
  document._elements.push(document.head, document.body, document._firstScript);

  const window = {
    document,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
  };
  return vm.createContext({ window, document, console });
}

function runMeta(context) {
  vm.runInContext(metaSource, context, { filename: 'meta-pixel-consent.js' });
}

function fbqCalls(context) {
  return JSON.parse(JSON.stringify((context.window.fbq?.queue || []).map((args) => Array.from(args))));
}

function insertedPixelScripts(context) {
  return context.document._elements.filter((element) => element.tagName === 'SCRIPT' && element.src === 'https://connect.facebook.net/en_US/fbevents.js');
}

test('Meta Pixel waits for marketing consent, then initializes and tracks PageView once', () => {
  const context = createMetaContext(null);

  runMeta(context);
  assert.equal(context.window.fbq, undefined);
  assert.equal(insertedPixelScripts(context).length, 0);
  assert.ok(context.document.querySelector('[data-marketing-consent-banner]'));

  context.document.querySelector('[data-marketing-accept]').dispatch('click');
  assert.deepEqual(fbqCalls(context), [
    ['init', '1606630404144793'],
    ['track', 'PageView'],
  ]);
  assert.equal(insertedPixelScripts(context).length, 1);

  runMeta(context);
  assert.deepEqual(fbqCalls(context), [
    ['init', '1606630404144793'],
    ['track', 'PageView'],
  ]);
  assert.equal(insertedPixelScripts(context).length, 1);
});

test('Meta Pixel does not send events without granted marketing consent', () => {
  const context = createMetaContext('denied');
  runMeta(context);

  context.window.cbtcTrackMetaEvent('Lead');

  assert.equal(context.window.fbq, undefined);
  assert.equal(insertedPixelScripts(context).length, 0);
});

function makeField(tagName, name, value = '') {
  const field = makeElement(tagName, null);
  field.name = name;
  field.value = value;
  return field;
}

function makeForm(formName, fieldValues = {}) {
  const form = makeElement('form', null);
  form.setAttribute('data-form', formName);
  const grid = makeElement('div', null);
  const button = makeElement('button', null);
  button.textContent = formName === 'apply' ? 'Apply for a spot' : 'Send me the routes';
  grid.appendChild(button);
  Object.entries(fieldValues).forEach(([name, value]) => {
    grid.appendChild(makeField(name === 'running' ? 'textarea' : 'input', name, value));
  });
  form.appendChild(grid);
  return { form, grid, button };
}

function createFormsContext(forms, fetchImpl) {
  const document = {
    createElement(tagName) {
      return makeElement(tagName, document);
    },
    querySelectorAll(selector) {
      return selector === 'form[data-form]' ? forms.map(({ form }) => form) : [];
    },
  };
  const window = { plausible: (...args) => window.plausible.calls.push(args), cbtcTrackMetaEvent: (...args) => window.cbtcTrackMetaEvent.calls.push(args) };
  window.plausible.calls = [];
  window.cbtcTrackMetaEvent.calls = [];
  return vm.createContext({
    window,
    document,
    fetch: fetchImpl,
    plausible: window.plausible,
    location: { href: 'https://www.costablancatrailcamp.com/' },
    console,
  });
}

function runForms(context) {
  vm.runInContext(formsSource, context, { filename: 'forms.js' });
}

function createFitCallContext(fetchImpl) {
  const document = {
    _elements: [],
    createElement(tagName) {
      const element = makeElement(tagName, document);
      document._elements.push(element);
      return element;
    },
    querySelector(selector) {
      return findElement(document._elements, selector);
    },
  };
  const cta = makeElement('p', document);
  cta.setAttribute('data-fit-call-cta', '');
  cta.hidden = true;
  const link = makeElement('a', document);
  link.setAttribute('data-fit-call-link', '');
  cta.appendChild(link);
  document._elements.push(cta, link);

  const context = vm.createContext({ document, fetch: fetchImpl, URL, console });
  context.cta = cta;
  context.link = link;
  return context;
}

function runFitCall(context) {
  vm.runInContext(fitCallSource, context, { filename: 'fit-call.js' });
}

function submit(form) {
  let prevented = false;
  form.dispatch('submit', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function jsonResponse(ok, data) {
  return { ok, json: async () => data };
}

test('apply success tracks Meta Lead once, never the retired registration event, after the API succeeds', async () => {
  let fetchCalls = 0;
  let resolveFetch;
  const pendingFetch = new Promise((resolve) => { resolveFetch = resolve; });
  const apply = makeForm('apply', {
    website: '',
    name: 'Runner',
    email: 'runner@example.com',
    running: 'I run trails every week.',
  });
  const context = createFormsContext([apply], () => {
    fetchCalls += 1;
    return pendingFetch;
  });
  runForms(context);

  submit(apply.form);
  submit(apply.form);
  assert.equal(fetchCalls, 1, 'duplicate submit guard should keep one API request pending');
  assert.deepEqual(context.window.cbtcTrackMetaEvent.calls, [], 'Lead waits for successful response');

  resolveFetch(jsonResponse(true, { ok: true }));
  await settle();
  await settle();

  assert.deepEqual(context.window.cbtcTrackMetaEvent.calls, [['Lead']]);
  assert.deepEqual(context.window.plausible.calls, [['Apply Submitted']]);
  assert.equal(apply.form.getAttribute('data-meta-lead-tracked'), 'true');
  assert.equal(apply.grid.children.length, 1);
  assert.equal(apply.grid.children[0].getAttribute('role'), 'status');
  assert.equal(formsSource.includes('Complete' + 'Registration'), false);
});

test('failed apply response restores UI and sends no Meta Lead', async () => {
  const apply = makeForm('apply', {
    website: '',
    name: 'Runner',
    email: 'runner@example.com',
    running: 'I run trails every week.',
  });
  const context = createFormsContext([apply], async () => jsonResponse(false, { error: 'Nope' }));
  runForms(context);

  submit(apply.form);
  await settle();
  await settle();

  assert.deepEqual(context.window.cbtcTrackMetaEvent.calls, []);
  assert.equal(apply.form.getAttribute('data-submitting'), null);
  assert.equal(apply.button.disabled, false);
  assert.equal(apply.form.querySelector('[data-form-error]').textContent, 'Nope');
});

test('routes success and honeypot pseudo-success do not send Meta Lead', async () => {
  const routes = makeForm('routes', { website: '', email: 'runner@example.com' });
  const honeypot = makeForm('apply', {
    website: 'bot-filled-this',
    name: 'Bot',
    email: 'bot@example.com',
    running: 'synthetic runner',
  });
  const context = createFormsContext([routes, honeypot], async () => jsonResponse(true, { ok: true }));
  runForms(context);

  submit(routes.form);
  submit(honeypot.form);
  await settle();
  await settle();

  assert.deepEqual(context.window.cbtcTrackMetaEvent.calls, []);
  assert.deepEqual(context.window.plausible.calls, [['Routes Submitted'], ['Apply Submitted']]);
});

test('analytics exceptions do not break successful apply UI', async () => {
  const apply = makeForm('apply', {
    website: '',
    name: 'Runner',
    email: 'runner@example.com',
    running: 'I run trails every week.',
  });
  const context = createFormsContext([apply], async () => jsonResponse(true, { ok: true }));
  context.window.cbtcTrackMetaEvent = () => {
    throw new Error('pixel blocked');
  };
  runForms(context);

  submit(apply.form);
  await settle();
  await settle();

  assert.equal(apply.grid.children.length, 1);
  assert.equal(apply.grid.children[0].getAttribute('role'), 'status');
  assert.equal(apply.form.querySelector('[data-form-error]'), null);
});

test('fit-call CTA stays hidden without a configured HTTPS booking URL', async () => {
  const context = createFitCallContext(async () => jsonResponse(true, { fitCallUrl: '' }));
  runFitCall(context);
  await settle();
  await settle();

  assert.equal(context.cta.hidden, true);
  assert.equal(context.link.href, undefined);
});

test('fit-call CTA reveals only with a configured HTTPS booking URL', async () => {
  const bookingUrl = 'https://calendar.google.com/calendar/appointments/schedules/example';
  const context = createFitCallContext(async () => jsonResponse(true, { fitCallUrl: bookingUrl }));
  runFitCall(context);
  await settle();
  await settle();

  assert.equal(context.cta.hidden, false);
  assert.equal(context.link.href, bookingUrl);
});

test('all rendered page shells have exactly one Plausible pageview loader', () => {
  const plausibleSrc = 'https://plausible.io/js/pa-Ph375L-pQZDyOfoQSaRdy.js';
  assert.equal((homeHtml.match(new RegExp(plausibleSrc, 'g')) || []).length, 1);
  assert.equal((runnerLayoutSource.match(new RegExp(plausibleSrc, 'g')) || []).length, 1);
  assert.ok(runnerLayoutSource.includes('plausible.init()'));
});

test('homepage and runner footers link the current Instagram handle accessibly', () => {
  const instagramUrl = 'https://www.instagram.com/costablancatrailcamp/';
  for (const source of [homeHtml, runnerLayoutSource]) {
    assert.ok(source.includes(instagramUrl));
    assert.ok(source.includes('@costablancatrailcamp'));
    assert.ok(source.includes('aria-label="Instagram @costablancatrailcamp"'));
  }
});
