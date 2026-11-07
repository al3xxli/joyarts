function imageUrl(group, item) {
  const base = group.id === 'ld' ? '/media/life-drawing/' : '/artwork/';
  return base + encodeURIComponent(item.file);
}

export function classesAndGallery(galleries, programs, esc) {
  const collections = galleries.map(group => {
    const course = programs.find(program => program.gallery === group.id);
    const items = [...group.items].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const recent = items[0]?.updatedAt ? items[0] : null;
    const kind = { classes: 'Classes', workshops: 'Workshops', exhibitions: 'Exhibitions' }[course?.section] || 'Studio archive';
    return { ...group, items, course, kind, recent, companion: items[1] };
  });
  const featured = collections.filter(group => group.recent)
    .sort((a, b) => b.recent.updatedAt.localeCompare(a.recent.updatedAt));
  const first = featured[0] || collections[0];

  function spotlight(group, i) {
    const item = group.recent;
    return `<div class="spotlight-slide"${i ? ' hidden' : ''}>
      <a class="print-table" href="#${group.slug}" aria-label="Explore ${esc(group.title)}">
        ${group.companion ? `<img class="back-print" src="${imageUrl(group, group.companion)}" alt="" loading="lazy">` : ''}
        <img class="front-print" src="${imageUrl(group, item)}" alt="${esc(item.alt)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
      </a>
      <div class="print-caption"><span>Recently updated</span><a href="#${group.slug}">${esc(group.title)} <span aria-hidden="true">↗</span></a></div>
    </div>`;
  }

  function collection(group) {
    const course = group.course;
    const courseTitle = course && course.title !== group.title ? course.title : group.kind;
    const tiles = group.items.map(item => {
      const src = imageUrl(group, item);
      return `<li><a href="${src}"><img src="${src}" width="${item.width}" height="${item.height}" alt="${esc(item.alt)}" loading="lazy"><span class="expand-icon" aria-hidden="true">↗</span></a></li>`;
    }).join('\n');
    return `<section id="${group.slug}" class="collection" aria-labelledby="title-${group.id}">
      <div class="collection-meta"><span>${esc(courseTitle)}</span><span>${group.items.length} works</span></div>
      <h3 id="title-${group.id}">${esc(group.title)}</h3>
      ${course ? '<p>' + esc(course.description) + '</p>' : ''}
      <ul class="artworks">${tiles}</ul>
    </section>`;
  }

  const kinds = ['Classes', 'Workshops', 'Exhibitions', 'Studio archive'];
  const categoryList = kinds.map(kind => `<div class="collection-group"><p>${kind}</p>${collections.filter(g => g.kind === kind).map(g =>
    `<a href="#${g.slug}">${esc(g.title)}<span aria-hidden="true">↗</span></a>`).join('')}</div>`).join('');
  const options = kinds.map(kind => `<optgroup label="${kind}">${collections.filter(g => g.kind === kind).map(g =>
    `<option value="${g.slug}"${g === first ? ' selected' : ''}>${esc(g.title)}</option>`).join('')}</optgroup>`).join('');

  return `<div class="studio-gallery" data-default="${first.slug}">
    <div class="gallery-hero">
      <div class="hero-copy"><h1>Classes <i>&amp;</i><br><em>Gallery</em></h1>
        <p>Explore our classes through student work, from first graphite studies to finished portfolios.</p>
        <a class="browse" href="#collections">Browse collections <span aria-hidden="true">↓</span></a>
      </div>
      <div class="spotlight" aria-label="Recently updated collections">
        <div class="spotlight-slides" aria-live="off">${featured.map(spotlight).join('\n')}</div>
        <button class="spotlight-timer" type="button" hidden aria-label="Pause featured slideshow">
          <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
            <circle class="timer-track" cx="18" cy="18" r="15"></circle>
            <circle class="timer-progress" cx="18" cy="18" r="15" pathLength="1"></circle>
          </svg><span class="timer-icon" aria-hidden="true"></span>
        </button>
        <div class="spotlight-controls" hidden><button type="button" aria-label="Previous featured collection">←</button><button type="button" aria-label="Next featured collection">→</button></div>
      </div>
    </div>
    <section id="collections" class="catalogue" aria-labelledby="collections-title">
      <h2 id="collections-title">Collections</h2>
      <div class="catalogue-grid">
        <div class="picker">
          <div class="collection-links" aria-label="Collections" role="navigation">${categoryList}</div>
          <label class="mobile-picker" hidden>Choose a collection<select>${options}</select></label>
        </div>
        <div class="collection-panel">${[first, ...collections.filter(g => g !== first)].map(collection).join('\n')}</div>
      </div>
    </section>
    <dialog aria-label="Student work image viewer">
      <button class="close" aria-label="Close image viewer" autofocus>×</button>
      <figure><img class="enlarged" alt=""><figcaption aria-live="polite"></figcaption></figure>
      <button class="previous" aria-label="Previous image">‹</button>
      <button class="next" aria-label="Next image">›</button>
    </dialog>
  </div>`;
}
