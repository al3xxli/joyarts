function redirectOldBookmark() {
  const key = location.hash.slice(1).toLowerCase();
  if (location.pathname === '/' && Object.hasOwn(legacyRoutes, key)) {
    location.replace(legacyRoutes[key]);
  }
}
redirectOldBookmark();
window.addEventListener('hashchange', redirectOldBookmark);

function setupSlideshow(container) {
  const slides = [...container.querySelectorAll('.slide')];
  const control = container.querySelector('button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let current = 0;
  let timer;
  function advance() {
    slides[current].classList.remove('visible');
    slides[current].setAttribute('aria-hidden', 'true');
    current = (current + 1) % slides.length;
    slides[current].classList.add('visible');
    slides[current].removeAttribute('aria-hidden');
  }
  function refresh() {
    clearInterval(timer);
    if (!paused && !document.hidden) timer = setInterval(advance, 4500);
    control.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    control.textContent = paused ? '▷' : 'Ⅱ';
  }
  control.hidden = false;
  control.addEventListener('click', () => { paused = !paused; refresh(); });
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; refresh(); });
  refresh();
}

function setupSpotlight(container) {
  const slides = [...container.querySelectorAll('.spotlight-slide')];
  if (slides.length < 2) return;
  const controls = container.querySelector('.spotlight-controls');
  const toggle = container.querySelector('.spotlight-timer');
  const ring = toggle.querySelector('.timer-progress');
  const slideList = container.querySelector('.spotlight-slides');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cycle = ring.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], {
    duration: 6000, fill: 'both',
  });
  let index = 0;
  let paused = motion.matches;

  function syncPlayback() {
    toggle.classList.toggle('paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Play featured slideshow' : 'Pause featured slideshow');
    slideList.setAttribute('aria-live', paused ? 'polite' : 'off');
    if (paused || document.hidden) cycle.pause();
    else cycle.play();
  }

  function navigate(step) {
    slides[index].hidden = true;
    index = (index + step + slides.length) % slides.length;
    slides[index].hidden = false;
    cycle.currentTime = 0;
    syncPlayback();
  }
  cycle.onfinish = () => navigate(1);
  controls.firstElementChild.addEventListener('click', () => navigate(-1));
  controls.lastElementChild.addEventListener('click', () => navigate(1));
  toggle.addEventListener('click', () => { paused = !paused; syncPlayback(); });
  slideList.addEventListener('focusin', () => { paused = true; syncPlayback(); });
  motion.addEventListener('change', () => { paused = motion.matches; syncPlayback(); });
  document.addEventListener('visibilitychange', () => syncPlayback());
  controls.hidden = false;
  toggle.hidden = false;
  syncPlayback();
}

function setupCollectionBrowser(container) {
  const sections = [...container.querySelectorAll('.collection')];
  const options = container.querySelector('select');
  const links = [...container.querySelectorAll('.collection-links a')];
  const catalogue = container.querySelector('.catalogue');
  function selectCollection() {
    const slug = location.hash.slice(1);
    const selected = sections.find(section => section.id === slug);
    const active = selected?.id || container.dataset.default;
    for (const section of sections) section.hidden = section.id !== active;
    for (const link of links) {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    options.value = active;
    if (selected) catalogue.scrollIntoView({ block: 'start' });
  }
  options.addEventListener('change', () => { location.hash = options.value; });
  container.querySelector('.mobile-picker').hidden = false;
  container.classList.add('interactive');
  window.addEventListener('hashchange', selectCollection);
  selectCollection();
}

function setupGallery(dialog) {
  let links = [];
  let current = 0;
  let touchStart;
  const full = dialog.querySelector('.enlarged');
  const caption = dialog.querySelector('figcaption');
  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    full.src = link.href;
    full.alt = link.querySelector('img').alt;
    caption.textContent = (current + 1) + ' / ' + links.length;
  }
  document.querySelectorAll('.artworks').forEach(grid => {
    grid.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      links = [...grid.querySelectorAll('a')];
      show(links.indexOf(link));
      dialog.showModal();
    });
  });
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.previous').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  full.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  full.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.clientX;
    const dy = event.changedTouches[0].clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  full.addEventListener('touchcancel', () => { touchStart = null; });
}
document.querySelectorAll('.slideshow').forEach(setupSlideshow);
document.querySelectorAll('.spotlight').forEach(setupSpotlight);
document.querySelectorAll('.studio-gallery').forEach(setupCollectionBrowser);
document.querySelectorAll('dialog').forEach(setupGallery);

