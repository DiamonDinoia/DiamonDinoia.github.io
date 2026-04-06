/* ==========================================================
   render.js — Fetches JSON data and populates the page
   Zero dependencies, vanilla JS
   ========================================================== */

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

/* --- Helpers --- */

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

function line(content) {
  const div = el('div', { className: 'line' });
  const lc = el('div', { className: 'line-content' });
  if (typeof content === 'string') lc.innerHTML = content;
  else if (content) lc.appendChild(content);
  else lc.innerHTML = '&nbsp;';
  div.appendChild(lc);
  return div;
}

/* --- C++ formatting helpers --- */

function cppSection(title) {
  return `<h2><span class="kw">namespace</span> <span class="fn">${title}</span> <span class="sep">{</span></h2>`;
}

function cppField(name, value, isLink) {
  if (isLink) {
    return `&nbsp;&nbsp;.${name} = <span class="str">"<a href="${value.url}">${value.text}</a>"</span>,`;
  }
  return `&nbsp;&nbsp;.${name} = <span class="str">"${value}"</span>,`;
}

function cppComment(text) {
  return `&nbsp;&nbsp;<span class="cm">// ${text}</span>`;
}

function cppOpen(title, type) {
  let s = '';
  if (type) s += `<span class="kw">struct</span> <span class="ty">${type}</span> `;
  s += `<span class="sep">{</span>`;
  if (title) s += ` <span class="cm">// ${title}</span>`;
  return s;
}

function cppClose() {
  return `<span class="sep">},</span>`;
}

/* --- About Page --- */

async function renderAbout() {
  const d = await loadJSON('data/profile.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  // Header
  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));

  // Hero
  lines.appendChild(line(`<h1 class="hero-title">${d.name}<span class="cursor"></span></h1>`));
  lines.appendChild(line(`<div class="subtitle"><span class="kw">constexpr auto</span> role = <span class="str">"${d.role}"</span><span class="sep">;</span></div>`));
  lines.appendChild(line(`<div class="subtitle"><span class="kw">constexpr auto</span> org  = <span class="str">"${d.org}"</span><span class="sep">;</span></div>`));
  lines.appendChild(line(null));

  // About
  lines.appendChild(line(cppSection('About')));

  const bioDiv = el('div', { className: 'line' });
  const bioLC = el('div', { className: 'line-content clearfix' });
  if (d.photo) {
    bioLC.appendChild(el('img', { className: 'profile-photo', src: d.photo, alt: d.name }));
  } else {
    bioLC.appendChild(el('div', { className: 'photo-placeholder', html: '// photo' }));
  }
  d.bio.forEach(p => bioLC.appendChild(el('p', { html: p })));
  bioDiv.appendChild(bioLC);
  lines.appendChild(bioDiv);
  lines.appendChild(line(null));

  // Education
  if (d.education && d.education.length) {
    lines.appendChild(line(cppSection('Education')));
    lines.appendChild(line(null));
    d.education.forEach(edu => {
      lines.appendChild(line(cppOpen(null, 'Degree')));
      lines.appendChild(line(cppField('name', edu.degree)));
      lines.appendChild(line(cppField('institution', edu.institution)));
      lines.appendChild(line(cppField('location', edu.location)));
      lines.appendChild(line(cppField('years', edu.years)));
      if (edu.score) lines.appendChild(line(cppField('grade', edu.score)));
      if (edu.affiliate) lines.appendChild(line(cppField('affiliation', edu.affiliate)));
      lines.appendChild(line(cppClose()));
      lines.appendChild(line(null));
    });
  }

  // Experience
  if (d.experience && d.experience.length) {
    lines.appendChild(line(cppSection('Experience')));
    lines.appendChild(line(null));
    d.experience.forEach(exp => {
      lines.appendChild(line(cppOpen(null, 'Position')));
      lines.appendChild(line(cppField('role', exp.role)));
      lines.appendChild(line(cppField('org', exp.org)));
      lines.appendChild(line(cppField('location', exp.location)));
      lines.appendChild(line(cppField('years', exp.years)));
      if (exp.desc) lines.appendChild(line(cppField('responsibilities', exp.desc)));
      lines.appendChild(line(cppClose()));
      lines.appendChild(line(null));
    });
  }

  // Awards
  if (d.awards && d.awards.length) {
    lines.appendChild(line(cppSection('Awards')));
    lines.appendChild(line(null));
    d.awards.forEach(award => {
      lines.appendChild(line(cppOpen(null, 'Award')));
      lines.appendChild(line(cppField('title', award.title)));
      lines.appendChild(line(cppField('year', award.year)));
      if (award.issuer) lines.appendChild(line(cppField('issuer', award.issuer)));
      if (award.detail) lines.appendChild(line(cppField('detail', award.detail)));
      lines.appendChild(line(cppClose()));
      lines.appendChild(line(null));
    });
    lines.appendChild(line(null));
  }

  // Languages
  if (d.languages && d.languages.length) {
    lines.appendChild(line(cppSection('Languages')));
    lines.appendChild(line(null));
    d.languages.forEach(l => {
      lines.appendChild(line(`<span class="str">"${l}"</span>`));
    });
    lines.appendChild(line(null));
  }

  // Links
  lines.appendChild(line(cppSection('Links')));
  lines.appendChild(line(null));
  d.links.forEach(l => {
    if (l.scrambled) {
      const a = el('a', { href: '#' });
      a.textContent = l.label.toLowerCase();
      a.addEventListener('click', e => {
        e.preventDefault();
        // Unscramble: even indices then odd indices were interleaved
        const s = l.scrambled;
        const mid = Math.ceil(s.length / 2);
        const evens = s.slice(0, mid);
        const odds = s.slice(mid);
        let result = '';
        for (let i = 0; i < s.length; i++) {
          result += i % 2 === 0 ? evens[i >> 1] : odds[i >> 1];
        }
        window.location.href = 'mai' + 'lto:' + result;
      });
      const wrapper = el('span', { html: `<span class="kw">#include</span> <span class="str">&lt;</span>` });
      wrapper.appendChild(a);
      wrapper.appendChild(el('span', { html: `<span class="str">&gt;</span>` }));
      lines.appendChild(line(wrapper));
    } else {
      lines.appendChild(line(
        `<span class="kw">#include</span> <span class="str">&lt;<a href="${l.url}">${l.label.toLowerCase()}</a>&gt;</span>`
      ));
    }
  });

  container.appendChild(lines);

  renderStatus(d.status_left, d.status_right_label, d.status_right_url);
  setTitlePath('~/about.hpp');
}

/* --- Publications Page --- */

async function renderPublications() {
  const d = await loadJSON('data/publications.json');
  const container = document.getElementById('content');
  if (!container) return;

  container.appendChild(el('h1', null, 'Publications'));
  container.appendChild(el('p', { className: 'cm', html: `// see also: <a href="${d.scholar_url}">Google Scholar</a>` }));
  container.appendChild(el('div', { className: 'section-spacer' }));

  const byYear = {};
  d.papers.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });

  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    container.appendChild(el('h2', { html: `<span class="cm">// ─── </span><span class="num">${year}</span>` }));
    const ul = el('ul', { className: 'pub-list' });

    byYear[year].forEach(paper => {
      const li = el('li');

      const titleDiv = el('div', { className: 'pub-title' });
      if (paper.url) {
        titleDiv.appendChild(el('a', { href: paper.url }, paper.title));
      } else {
        titleDiv.textContent = paper.title;
      }
      li.appendChild(titleDiv);

      const authorsDiv = el('div', { className: 'pub-authors' });
      authorsDiv.innerHTML = paper.authors.map(a =>
        a.includes('Barbone') ? `<span class="me">${a}</span>` : a
      ).join(', ');
      li.appendChild(authorsDiv);

      const venueDiv = el('div', { className: 'pub-venue' });
      let venueHTML = `<span class="venue-name">${paper.venue}</span>`;
      if (paper.venue_note) venueHTML += ` (${paper.venue_note})`;
      venueHTML += `, <span class="venue-year">${paper.year}</span>`;
      venueDiv.innerHTML = venueHTML;
      li.appendChild(venueDiv);

      (paper.links || []).forEach(link => {
        li.appendChild(el('a', {
          className: `badge badge-${link.type || 'doi'}`,
          href: link.url
        }, link.label));
      });

      ul.appendChild(li);
    });

    container.appendChild(ul);
  });

  renderStatus(['marco_barbone', 'main', 'UTF-8'], 'Google Scholar', d.scholar_url);
  setTitlePath('~/papers.hpp');
}

/* --- Projects Page --- */

async function renderProjects() {
  const d = await loadJSON('data/projects.json');
  const container = document.getElementById('content');
  if (!container) return;

  container.appendChild(el('h1', null, 'Projects'));
  container.appendChild(el('p', { className: 'cm', html: '// selected open-source contributions' }));
  container.appendChild(el('div', { className: 'section-spacer' }));

  const grid = el('div', { className: 'card-grid' });

  d.projects.forEach(proj => {
    const card = el('div', { className: 'card' });

    const title = el('div', { className: 'card-title' });
    title.appendChild(el('a', { href: proj.url }, proj.name));
    card.appendChild(title);

    const meta = el('div', { className: 'card-meta' });
    proj.langs.forEach(lang => {
      meta.appendChild(el('span', { className: 'badge badge-lang' }, lang));
    });
    card.appendChild(meta);

    card.appendChild(el('div', { className: 'card-desc' }, proj.description));
    grid.appendChild(card);
  });

  const moreCard = el('div', { className: 'card' });
  moreCard.appendChild(el('div', { className: 'card-title', html: `<a href="${d.github_url}">+ ${d.total_repos - d.projects.length} more repos</a>` }));
  moreCard.appendChild(el('div', { className: 'card-desc', html: `Including LLVM contributions, CPU performance benchmarks, FPGA acceleration, diagram Monte Carlo, and more.<br><br><a href="${d.github_url}">github.com/DiamonDinoia &rarr;</a>` }));
  grid.appendChild(moreCard);

  container.appendChild(grid);

  renderStatus(['marco_barbone', 'main', 'UTF-8'], 'github.com/DiamonDinoia', d.github_url);
  setTitlePath('~/projects.hpp');
}

/* --- Talks Page --- */

async function renderTalks() {
  const d = await loadJSON('data/talks.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));
  lines.appendChild(line('<h1>Talks & Lectures</h1>'));
  lines.appendChild(line('<p class="cm">// conferences, seminars, and teaching</p>'));
  lines.appendChild(line(null));

  if (d.talks && d.talks.length) {
    lines.appendChild(line(cppSection('Presentations')));
    lines.appendChild(line(null));

    const byYear = {};
    d.talks.forEach(t => { (byYear[t.year] = byYear[t.year] || []).push(t); });

    Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
      lines.appendChild(line(`<h3><span class="cm">// ── </span><span class="num">${year}</span></h3>`));
      byYear[year].forEach(talk => {
        lines.appendChild(line(cppOpen(null, 'Talk')));
        lines.appendChild(line(cppField('title', talk.title)));
        lines.appendChild(line(cppField('event', talk.event)));
        lines.appendChild(line(cppField('org', talk.org)));
        lines.appendChild(line(cppField('type', talk.type)));
        if (talk.url) lines.appendChild(line(cppField('url', { url: talk.url, text: 'link' }, true)));
        if (talk.links && talk.links.length) {
          talk.links.forEach(link => {
            lines.appendChild(line(cppField(link.label, { url: link.url, text: link.label }, true)));
          });
        }
        lines.appendChild(line(cppClose()));
        lines.appendChild(line(null));
      });
    });
  }

  if (d.lectures && d.lectures.length) {
    lines.appendChild(line(cppSection('Teaching')));
    lines.appendChild(line(null));
    d.lectures.forEach(lec => {
      lines.appendChild(line(cppOpen(null, 'Lecture')));
      lines.appendChild(line(cppField('title', lec.title)));
      lines.appendChild(line(cppField('org', lec.org)));
      lines.appendChild(line(cppField('location', lec.location)));
      if (lec.url) lines.appendChild(line(cppField('url', { url: lec.url, text: 'link' }, true)));
      if (lec.links && lec.links.length) {
        lec.links.forEach(link => {
          lines.appendChild(line(cppField(link.label, { url: link.url, text: link.label }, true)));
        });
      }
      lines.appendChild(line(cppClose()));
      lines.appendChild(line(null));
    });
  }

  container.appendChild(lines);

  renderStatus(['marco_barbone', 'main', 'UTF-8'], '', '');
  setTitlePath('~/talks.hpp');
}

/* --- Personal Page --- */

async function renderPersonal() {
  const d = await loadJSON('data/personal.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));
  lines.appendChild(line('<h1>Personal</h1>'));
  lines.appendChild(line(`<p class="cm">// ${d.headline}</p>`));
  lines.appendChild(line(null));

  d.sections.forEach(section => {
    lines.appendChild(line(cppSection(section.title)));

    if (section.content) {
      lines.appendChild(line(`<p>${section.content}</p>`));
    }

    (section.items || []).forEach(item => {
      if (item.type === 'quote') {
        lines.appendChild(line(`<span class="cm">// ${item.text}</span>`));
      } else if (item.type === 'text') {
        lines.appendChild(line(`<p>${item.text}</p>`));
      } else if (item.type === 'image') {
        lines.appendChild(line(`<img src="${item.src}" alt="${item.alt || ''}" style="max-width:100%;border-radius:6px;border:1px solid var(--border);">`));
      } else if (item.type === 'link') {
        lines.appendChild(line(`<span class="kw">#include</span> <span class="str">&lt;<a href="${item.url}">${item.text}</a>&gt;</span>`));
      }
    });

    lines.appendChild(line(null));
  });

  container.appendChild(lines);

  renderStatus(['marco_barbone', 'main', 'UTF-8'], 'work in progress', '');
  setTitlePath('~/personal.hpp');
}

/* --- Status Bar --- */

function renderStatus(left, rightLabel, rightUrl) {
  const bar = document.getElementById('status-bar');
  if (!bar) return;

  const sl = el('div', { className: 'status-left' });
  left.forEach(s => sl.appendChild(el('span', null, s)));

  const sr = el('div', { className: 'status-right' });
  if (rightUrl) {
    sr.appendChild(el('a', { href: rightUrl }, rightLabel));
  } else {
    sr.appendChild(el('span', null, rightLabel));
  }

  bar.appendChild(sl);
  bar.appendChild(sr);
}

function setTitlePath(path) {
  const el = document.getElementById('title-path');
  if (el) el.textContent = `marco_barbone — ${path}`;
}
