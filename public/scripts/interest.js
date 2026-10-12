import { queryPreferences, camps } from './camps.js';
const inputs = [...document.querySelectorAll('input[name="camps"]')];
function select(id) {
  if (!camps.some(c => c.id === id)) return;
  inputs.forEach(i => { if (i.value === id) i.checked = true; if (i.value === 'later') i.checked = false; });
}
queryPreferences(location.search).forEach(select);
inputs.forEach(input => input.addEventListener('change', () => {
  if (!input.checked) return;
  inputs.forEach(other => { if (other !== input && (input.value === 'later' || other.value === 'later')) other.checked = false; });
}));
document.querySelectorAll('[data-camp]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); select(link.dataset.camp);
  history.replaceState(null, '', link.href);
  document.getElementById('interest').scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth'});
}));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
let paused = false;
const rows = [...document.querySelectorAll('.camp')];
const video = document.querySelector('video');
const controls = [...document.querySelectorAll('.motion-toggle')];
const visible = new Set();
function updateMotion() {
  const blocked = reduced.matches || connection?.saveData || ['slow-2g','2g'].includes(connection?.effectiveType);
  const stop = paused || blocked || document.hidden;
  document.body.classList.toggle('motion-paused', stop);
  rows.forEach(row => row.classList.toggle('live', !stop && visible.has(row)));
  controls.forEach(button => {
    button.hidden = !!blocked;
    button.dataset.state = paused ? 'paused' : 'playing';
    const label = paused ? 'Resume animations' : 'Pause animations';
    button.setAttribute('aria-label', label);
    button.title = label;
  });
  if (!video) return;
  if (!stop && visible.has(video)) {
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(() => {});
  } else video.pause();
  if (blocked && video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
}
controls.forEach(button => button.addEventListener('click', () => { paused = !paused; updateMotion(); }));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { entries.forEach(e => { if(e.isIntersecting) visible.add(e.target); else visible.delete(e.target); }); updateMotion(); });
  [...rows, video].filter(Boolean).forEach(el => observer.observe(el));
}
reduced.addEventListener('change', updateMotion);
connection?.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', updateMotion);
updateMotion();
