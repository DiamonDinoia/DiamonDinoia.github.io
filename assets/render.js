/* ==========================================================
   render.js — Fetches JSON data and populates the page
   Zero dependencies, vanilla JS
   ========================================================== */

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

/* --- Global Search --- */

async function initGlobalSearch() {
  const input = document.getElementById('global-search');
  const resultsEl = document.getElementById('search-results');
  if (!input || !resultsEl) return;

  // Load all data
  const [profile, pubs, projects, talks] = await Promise.all([
    loadJSON('data/profile.json').catch(() => null),
    loadJSON('data/publications.json').catch(() => null),
    loadJSON('data/projects.json').catch(() => null),
    loadJSON('data/talks.json').catch(() => null),
  ]);

  function search(query) {
    if (!query) { resultsEl.classList.remove('visible'); return; }
    resultsEl.innerHTML = '';
    let hasResults = false;

    // Search papers
    if (pubs && pubs.papers) {
      const matches = pubs.papers.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.authors.join(' ').toLowerCase().includes(query) ||
        p.venue.toLowerCase().includes(query)
      );
      if (matches.length) {
        hasResults = true;
        resultsEl.appendChild(el('div', { className: 'search-group-title' }, 'papers.hpp'));
        matches.slice(0, 8).forEach(p => {
          const a = el('a', { className: 'search-result-item', href: 'publications.html' });
          a.innerHTML = `<div class="sr-title">${p.title}</div><div class="sr-detail">${p.venue}, ${p.year}</div>`;
          resultsEl.appendChild(a);
        });
      }
    }

    // Search projects (curated + all GitHub repos)
    if (projects) {
      const allProjects = (projects.projects || []).concat(projects.other_repos || []);
      const matches = allProjects.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.langs || []).join(' ').toLowerCase().includes(query)
      );
      if (matches.length) {
        hasResults = true;
        resultsEl.appendChild(el('div', { className: 'search-group-title' }, 'projects.hpp'));
        matches.slice(0, 10).forEach(p => {
          const a = el('a', { className: 'search-result-item', href: p.url || 'projects.html' });
          a.setAttribute('target', '_blank');
          a.innerHTML = `<div class="sr-title">${p.name}</div><div class="sr-detail">${p.description || ''}</div>`;
          resultsEl.appendChild(a);
        });
      }
    }

    // Search talks
    if (talks) {
      const allTalks = (talks.talks || []).concat(talks.lectures || []);
      const matches = allTalks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.event || '').toLowerCase().includes(query) ||
        t.org.toLowerCase().includes(query)
      );
      if (matches.length) {
        hasResults = true;
        resultsEl.appendChild(el('div', { className: 'search-group-title' }, 'talks.hpp'));
        matches.slice(0, 8).forEach(t => {
          const a = el('a', { className: 'search-result-item', href: 'talks.html' });
          a.innerHTML = `<div class="sr-title">${t.title}</div><div class="sr-detail">${t.event || t.org}</div>`;
          resultsEl.appendChild(a);
        });
      }
    }

    // Search profile
    if (profile) {
      const sections = ['education', 'experience', 'awards'];
      sections.forEach(section => {
        if (!profile[section]) return;
        const matches = profile[section].filter(item => {
          const text = Object.values(item).join(' ').toLowerCase();
          return text.includes(query);
        });
        if (matches.length) {
          hasResults = true;
          resultsEl.appendChild(el('div', { className: 'search-group-title' }, 'about.hpp — ' + section));
          matches.slice(0, 4).forEach(m => {
            const a = el('a', { className: 'search-result-item', href: 'index.html' });
            const label = m.degree || m.role || m.title || '';
            const detail = m.institution || m.org || m.issuer || '';
            a.innerHTML = `<div class="sr-title">${label}</div><div class="sr-detail">${detail}</div>`;
            resultsEl.appendChild(a);
          });
        }
      });
    }

    if (!hasResults) {
      resultsEl.appendChild(el('div', { className: 'search-no-results' }, 'no matches'));
    }

    resultsEl.classList.add('visible');
  }

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => search(input.value.toLowerCase().trim()), 150);
  });

  // Close on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.tab-search') && !e.target.closest('.search-results')) {
      resultsEl.classList.remove('visible');
    }
  });

  // Close on Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      resultsEl.classList.remove('visible');
      input.blur();
    }
  });
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', initGlobalSearch);

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
  const id = 'section-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<h2 id="${id}"><span class="kw">namespace</span> <span class="fn">${title}</span> <span class="sep">{</span></h2>`;
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
  if (type) s += `<span class="ty">${type}</span> `;
  s += `<span class="sep">{</span>`;
  if (title) s += ` <span class="cm">// ${title}</span>`;
  return s;
}

function cppClose() {
  return `<span class="sep">};</span>`;
}

function cppSectionClose(title) {
  return `<span class="sep">}</span> <span class="cm">// namespace ${title}</span>`;
}

/* --- About Page --- */

async function renderAbout() {
  const d = await loadJSON('data/profile.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));
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
  lines.appendChild(line(cppSectionClose('About')));
  lines.appendChild(line(null));

  // Education
  if (d.education && d.education.length) {
    lines.appendChild(line(cppSection('Education')));
    d.education.forEach(edu => {
      lines.appendChild(line(cppOpen(null, 'Degree')));
      lines.appendChild(line(cppField('name', edu.degree)));
      lines.appendChild(line(cppField('institution', edu.institution)));
      lines.appendChild(line(cppField('location', edu.location)));
      lines.appendChild(line(cppField('years', edu.years)));
      if (edu.score) lines.appendChild(line(cppField('grade', edu.score)));
      if (edu.affiliate) lines.appendChild(line(cppField('affiliation', edu.affiliate)));
      lines.appendChild(line(cppClose()));
    });
    lines.appendChild(line(cppSectionClose('Education')));
    lines.appendChild(line(null));
  }

  // Experience
  if (d.experience && d.experience.length) {
    lines.appendChild(line(cppSection('Experience')));
    d.experience.forEach(exp => {
      lines.appendChild(line(cppOpen(null, 'Position')));
      lines.appendChild(line(cppField('role', exp.role)));
      lines.appendChild(line(cppField('org', exp.org)));
      lines.appendChild(line(cppField('location', exp.location)));
      lines.appendChild(line(cppField('years', exp.years)));
      if (exp.desc) lines.appendChild(line(cppField('responsibilities', exp.desc)));
      lines.appendChild(line(cppClose()));
    });
    lines.appendChild(line(cppSectionClose('Experience')));
    lines.appendChild(line(null));
  }

  // Awards
  if (d.awards && d.awards.length) {
    lines.appendChild(line(cppSection('Awards')));
    d.awards.forEach(award => {
      lines.appendChild(line(cppOpen(null, 'Award')));
      lines.appendChild(line(cppField('title', award.title)));
      lines.appendChild(line(cppField('year', award.year)));
      if (award.issuer) lines.appendChild(line(cppField('issuer', award.issuer)));
      if (award.detail) lines.appendChild(line(cppField('detail', award.detail)));
      lines.appendChild(line(cppClose()));
    });
    lines.appendChild(line(cppSectionClose('Awards')));
    lines.appendChild(line(null));
  }

  // Languages
  if (d.languages && d.languages.length) {
    lines.appendChild(line(cppSection('Languages')));
    lines.appendChild(line(`<span class="kw">constexpr</span> <span class="kw">auto</span> spoken = <span class="ty">std::array</span><span class="sep">{</span>`));
    d.languages.forEach(l => {
      lines.appendChild(line(`&nbsp;&nbsp;<span class="str">"${l}"</span><span class="sep">,</span>`));
    });
    lines.appendChild(line(`<span class="sep">};</span>`));
    lines.appendChild(line(cppSectionClose('Languages')));
    lines.appendChild(line(null));
  }

  // Links
  lines.appendChild(line(cppSection('Links')));
  d.links.forEach(l => {
    if (l.scrambled) {
      const a = el('a', { href: '#' });
      a.textContent = l.label.toLowerCase();
      a.addEventListener('click', e => {
        e.preventDefault();
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
  lines.appendChild(line(cppSectionClose('Links')));
  lines.appendChild(line(null));

  // LLM disclaimer
  lines.appendChild(line(`<span class="cm">// WARNING: This website was generated by an LLM.</span>`));
  lines.appendChild(line(`<span class="cm">// It will only be maintained by LLMs — the author does not plan to learn web dev.</span>`));
  lines.appendChild(line(`<span class="cm">// Bugs? Blame the model, not me.</span>`));

  container.appendChild(lines);

  renderStatus(d.status_left, d.status_right_label, d.status_right_url);
  setTitlePath('~/about.hpp');
}

/* --- Publications Page --- */

async function renderPublications() {
  const d = await loadJSON('data/publications.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));
  lines.appendChild(line(`<h1>Publications</h1>`));
  lines.appendChild(line(`<span class="cm">// see also: <a href="${d.scholar_url}">Google Scholar</a></span>`));
  lines.appendChild(line(null));

  const byYear = {};
  d.papers.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });
  const years = Object.keys(byYear).sort((a, b) => b - a);

  const controls = el('div', { className: 'pub-controls' });
  const filters = el('div', { className: 'year-filters' });
  const allPill = el('button', { className: 'year-pill active' }, 'all');
  filters.appendChild(allPill);
  years.forEach(year => {
    filters.appendChild(el('button', { className: 'year-pill' }, year));
  });
  controls.appendChild(filters);
  lines.appendChild(line(controls));

  const resultsContainer = el('div');
  const allPaperWraps = [];

  function renderPapers(filterYear, query) {
    resultsContainer.innerHTML = '';
    allPaperWraps.length = 0;
    const filteredYears = filterYear ? [filterYear] : years;

    filteredYears.forEach(year => {
      let papers = byYear[year];
      if (query) {
        papers = papers.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.authors.join(' ').toLowerCase().includes(query) ||
          p.venue.toLowerCase().includes(query)
        );
      }
      if (!papers.length) return;

      resultsContainer.appendChild(line(`<h3 id="year-${year}"><span class="cm">// ─── </span><span class="num">${year}</span></h3>`));

      papers.forEach(paper => {
        const wrap = el('div', { className: 'pub-entry' });
        const titleDiv = el('div', { className: 'pub-title' });
        if (paper.url) {
          titleDiv.appendChild(el('a', { href: paper.url }, paper.title));
        } else {
          titleDiv.textContent = paper.title;
        }
        wrap.appendChild(line(titleDiv));

        const authorsDiv = el('div', { className: 'pub-authors' });
        authorsDiv.innerHTML = paper.authors.map(a =>
          a.includes('Barbone') ? `<span class="me">${a}</span>` : a
        ).join(', ');
        wrap.appendChild(line(authorsDiv));

        const venueDiv = el('div', { className: 'pub-venue' });
        let venueHTML = `<span class="venue-name">${paper.venue}</span>`;
        if (paper.venue_note) venueHTML += ` (${paper.venue_note})`;
        venueHTML += `, <span class="venue-year">${paper.year}</span>`;
        venueDiv.innerHTML = venueHTML;
        wrap.appendChild(line(venueDiv));

        const badgeLine = el('div');
        (paper.links || []).forEach(link => {
          badgeLine.appendChild(el('a', {
            className: `badge badge-${link.type || 'doi'}`,
            href: link.url
          }, link.label));
        });
        if (badgeLine.children.length) wrap.appendChild(line(badgeLine));
        resultsContainer.appendChild(wrap);
      });
    });
  }

  let activeYear = null;

  // Year pill click handlers
  filters.addEventListener('click', e => {
    if (!e.target.classList.contains('year-pill')) return;
    filters.querySelectorAll('.year-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    activeYear = e.target.textContent === 'all' ? null : e.target.textContent;
    renderPapers(activeYear, '');
  });

  lines.appendChild(resultsContainer);
  container.appendChild(lines);
  renderPapers(null, '');

  renderStatus(['marco_barbone', 'main', 'UTF-8'], 'Google Scholar', d.scholar_url);
  setTitlePath('~/papers.hpp');
}

/* --- Projects Page --- */

async function renderProjects() {
  const d = await loadJSON('data/projects.json');
  const container = document.getElementById('content');
  if (!container) return;

  const lines = el('div', { className: 'lines' });

  lines.appendChild(line(`<span class="kw">#pragma once</span>`));
  lines.appendChild(line(null));
  lines.appendChild(line(`<span class="cm">// see also: <a href="${d.github_url}">github.com/DiamonDinoia</a></span>`));
  lines.appendChild(line(null));

  lines.appendChild(line(cppSection('Projects')));
  d.projects.forEach(proj => {
    lines.appendChild(line(cppOpen(null, 'Project')));
    lines.appendChild(line(cppField('name', { url: proj.url, text: proj.name }, true)));
    lines.appendChild(line(cppField('desc', proj.description)));
    const langsStr = proj.langs.map(l => `<span class="str">"${l}"</span>`).join(', ');
    lines.appendChild(line(`&nbsp;&nbsp;.langs = <span class="ty">std::array</span><span class="sep">{</span>${langsStr}<span class="sep">}</span>,`));
    lines.appendChild(line(cppClose()));
  });
  lines.appendChild(line(cppSectionClose('Projects')));

  container.appendChild(lines);

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
  lines.appendChild(line(null));

  if (d.talks && d.talks.length) {
    lines.appendChild(line(cppSection('Presentations')));
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
      });
    });
    lines.appendChild(line(cppSectionClose('Presentations')));
  }

  if (d.lectures && d.lectures.length) {
    lines.appendChild(line(cppSection('Teaching')));
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
    });
    lines.appendChild(line(cppSectionClose('Teaching')));
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

    lines.appendChild(line(cppSectionClose(section.title)));
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
