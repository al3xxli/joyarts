import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { classesAndGallery } from './src/classes.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const readJson = async name => JSON.parse(await readFile(path.join(root, 'src', name), 'utf8'));
const studio = await readJson('studio.json');
const galleries = await readJson('galleries.json');
const output = await mkdtemp(path.join(root, '.joyarts-build-'));
const updates = path.join(root, 'public', 'Joyarts Updates');
const nav = [['About', '/'], ['Classes & Gallery', '/classes/'], ['Workshops', '/workshops/'], ['Exhibitions', '/exhibitions/']];
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const galleryUrl = gallery => '/classes/#' + gallery.slug;
const studioPhoto = file => '/media/studio/' + file;
const urls = [];

function page({ title, url, description, body, active }) {
  const fullTitle = title === 'JoyArts Studio' ? title + ' | Since 2013' : title + ' | JoyArts Studio';
  const links = nav.map(([label, href]) =>
    `<a href="${href}"${active === label ? ' aria-current="' + (url === href ? 'page' : 'location') + '"' : ''}>${esc(label)}</a>`
  ).join('\n        ');
  return `<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="https://joyarts.ca${url}">
  <meta property="og:site_name" content="JoyArts Studio">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="https://joyarts.ca${url}">
  <meta property="og:image" content="https://joyarts.ca/media/studio/share.jpg">
  <meta property="og:image:alt" content="JoyArts wordmark">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/media/studio/favicon.png">
  <link rel="apple-touch-icon" href="/media/studio/apple-touch-icon.png">
  <link rel="stylesheet" href="/site.css">
  <script src="/site.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header>
    <div class="masthead">
      <a class="mark" href="/" aria-label="JoyArts Studio home"><img src="/media/studio/studio-mark.png" width="52" height="52" alt=""><span>JoyArts Studio</span></a>
      <nav aria-label="Main navigation">
        ${links}
      </nav>
    </div>
  </header>
  <main id="main">${body}</main>
  <footer>© 2013-2026 JoyArts Inc. All rights reserved.</footer>
</body>
</html>\n`;
}

async function writePage(options) {
  const dir = path.join(output, options.url);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page(options));
  urls.push('https://joyarts.ca' + options.url);
}

function profile(name, lines, src) {
  return `<article class="profile">
    <div><h3>${esc(name)}</h3><p>${lines.map(esc).join('<br>')}</p></div>
    <img class="portrait" src="${src}" alt="${esc(name)}" loading="lazy">
  </article>`;
}

function home() {
  const teachers = studio.adjunctInstructors.map(line => {
    const [name, detail] = line.split(': ');
    return `<div><dt>${esc(name)}</dt><dd>${esc(detail)}</dd></div>`;
  }).join('\n');
  return `<h1 class="wordmark"><img src="/media/studio/wordmark.png" alt="JoyArts"><span>Studio</span><small>Since 2013</small></h1>
  <div class="intro">
    <div class="slideshow" aria-label="Studio photographs">
      ${['Flowers and student artwork in the studio', 'Studio windows surrounded by greenery', 'Piano beneath the studio gallery wall'].map((alt, i) =>
        `<img class="slide${i === 0 ? ' visible' : ''}" src="/media/studio/studio-${i + 1}.jpg" alt="${alt}"${i ? ' aria-hidden="true"' : ' fetchpriority="high"'}>`).join('\n')}
      <button class="slide-control" hidden aria-label="Pause slideshow">Ⅱ</button>
    </div>
    <div class="introduction">${studio.introduction.map(text => '<p>' + esc(text) + '</p>').join('\n')}</div>
  </div>
  <section class="instructors"><h2>Meet your instructors</h2>
    ${profile('Elsie Wang', studio.elsie, '/artwork/Elsie.jpg')}
    ${profile('Ms. Hannah', studio.hannah, studioPhoto('hannah.jpg'))}
    <article class="profile birds"><div><h3>Special guests — Nini &amp; Sky</h3><p>${esc(studio.birds)}</p></div>
      <div class="bird-photos"><img src="/media/studio/nini.jpg" alt="Nini, the studio’s African Grey" loading="lazy"><img class="sky-portrait" src="/artwork/Parrot%20Sky.jpg" alt="Sky, the studio’s Monk Parakeet" loading="lazy"></div>
    </article>
    <article class="supply"><h3>Adjunct instructors</h3><p>${esc(studio.mentorship)}</p><dl>${teachers}</dl></article>
  </section>`;
}

function programs(section) {
  return studio.programs.filter(course => course.section === section).map(course => {
    const gallery = galleries.find(group => group.id === course.gallery);
    return `<article class="program">
      <div><h2>${esc(course.title)}</h2><p>${esc(course.description)}</p></div>
      <a class="program-photo" href="${galleryUrl(gallery)}" aria-label="View ${esc(gallery.title)} gallery"><img src="${esc(encodeURI(course.image))}" alt="${esc(course.alt)}" loading="lazy"></a>
    </article>`;
  }).join('\n');
}

async function redirectPage(oldUrl, target) {
  const directory = path.join(output, oldUrl);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="https://joyarts.ca/classes/"><title>Classes &amp; Gallery | JoyArts Studio</title></head><body><a href="${target}">Open Classes &amp; Gallery</a></body></html>`);
}

try {
  await cp(path.join(root, 'media'), path.join(output, 'media'), { recursive: true });
  await mkdir(path.join(output, 'artwork'));
  const expected = galleries.filter(group => group.id !== 'ld').flatMap(group => group.items.map(item => item.file));
  expected.push('Elsie.jpg', 'Parrot Sky.jpg');
  const supplied = (await readdir(updates)).filter(name => /\.jpe?g$/i.test(name));
  const unlisted = supplied.filter(name => !expected.includes(name));
  if (unlisted.length) throw new Error('Add the new photos to src/galleries.json: ' + unlisted.join(', '));
  for (const file of expected) await cp(path.join(updates, file), path.join(output, 'artwork', file));
  await cp(path.join(root, 'src/site.css'), path.join(output, 'site.css'));

  await writePage({title: 'JoyArts Studio', url: '/', active: 'About', description: 'Founded in 2013, JoyArts Studio offers foundational art classes, portfolio mentorship, painting workshops and community exhibitions.', body: home()});
  await writePage({title: 'Classes & Gallery', url: '/classes/', active: 'Classes & Gallery',
    description: 'Explore JoyArts classes through recent student work, from drawing and painting to portfolio development.',
    body: classesAndGallery(galleries, studio.programs, esc)});
  for (const [label, url] of nav.slice(2)) {
    const section = label.toLowerCase();
    await writePage({title: label, url, active: label, description: studio.programs.filter(course => course.section === section).map(course => course.title).join(', ') + ' at JoyArts Studio.', body: `<h1>${label}</h1><div class="programs">${programs(section)}</div>`});
  }
  await redirectPage('/gallery/', '/classes/');
  for (const group of galleries) await redirectPage('/gallery/' + group.slug + '/', galleryUrl(group));
  const legacy = Object.fromEntries(galleries.map(group => [group.id, galleryUrl(group)]));
  Object.assign(legacy, {home:'/', classes:'/classes/', workshops:'/workshops/', camps:'/exhibitions/', exhibitions:'/exhibitions/', gallery:'/classes/', campgallery:'/classes/'});
  await writeFile(path.join(output, 'site.js'), 'const legacyRoutes = ' + JSON.stringify(legacy) + ';\n' + await readFile(path.join(root, 'src/site.js'), 'utf8'));
  await writeFile(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => '  <url><loc>' + url + '</loc></url>').join('\n') + '\n</urlset>\n');
  await cp(path.join(root, 'src/robots.txt'), path.join(output, 'robots.txt'));
  const dist = path.join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await rename(output, dist);
  console.log(`Built ${urls.length} pages, ${galleries.length} galleries and ${expected.length} supplied photos in dist/.`);
} catch (error) {
  await rm(output, { recursive: true, force: true });
  throw error;
}
