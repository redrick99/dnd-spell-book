'use strict';

// ─── Data & State ───────────────────────────────────────────────────────────
let allSpells = [];
const filters = { classes: new Set(), levels: new Set(), schools: new Set(), actions: new Set() };
let searchQuery = '';
let sortBy = 'name';
let currentView = 'all'; // 'all' | 'saved'
let savedSlugs = new Set(JSON.parse(localStorage.getItem('savedSpells') || '[]'));

// ─── Label helpers ──────────────────────────────────────────────────────────
const LEVEL_LABELS = {
  0: 'Trucchetto', 1: '1° Livello', 2: '2° Livello', 3: '3° Livello',
  4: '4° Livello', 5: '5° Livello', 6: '6° Livello', 7: '7° Livello',
  8: '8° Livello', 9: '9° Livello',
};
const SCHOOL_IT = {
  abjuration: 'Abiurazione', conjuration: 'Congiurazione', divination: 'Divinazione',
  enchantment: 'Ammaliamento', evocation: 'Evocazione', illusion: 'Illusione',
  necromancy: 'Negromanzia', transmutation: 'Trasmutazione',
};
const ACTION_IT = {
  action: 'Azione', bonus_action: 'Azione Bonus', reaction: 'Reazione',
  '1 minute': '1 Minuto', '10 minutes': '10 Minuti', '1 hour': '1 Ora',
  'special': 'Speciale',
};
const CLASS_IT = {
  bard: 'Bardo', cleric: 'Chierico', druid: 'Druido', paladin: 'Paladino',
  ranger: 'Ranger', sorcerer: 'Stregone', warlock: 'Warlock', wizard: 'Mago',
  artificer: 'Artefice', fighter: 'Guerriero', rogue: 'Ladro',
};

function levelLabel(l) { return LEVEL_LABELS[l] ?? `${l}° Livello`; }
function schoolIt(s)   { return SCHOOL_IT[s]   ?? capitalize(s); }
function actionIt(a)   { return ACTION_IT[a]   ?? capitalize(a?.replace(/_/g, ' ') ?? ''); }
function classIt(c)    { return CLASS_IT[c]    ?? capitalize(c); }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ─── Saved spells ────────────────────────────────────────────────────────────
function persistSaved() {
  localStorage.setItem('savedSpells', JSON.stringify([...savedSlugs]));
}

function toggleSaved(slug, e) {
  e.stopPropagation();
  if (savedSlugs.has(slug)) {
    savedSlugs.delete(slug);
  } else {
    savedSlugs.add(slug);
  }
  persistSaved();
  updateSavedBadge();
  if (currentView === 'saved') {
    render();
  } else {
    // just update the bookmark icon on the card
    const btn = document.querySelector(`.btn-bookmark[data-slug="${slug}"]`);
    if (btn) {
      btn.classList.toggle('saved', savedSlugs.has(slug));
      btn.title = savedSlugs.has(slug) ? 'Rimuovi dai salvati' : 'Salva incantesimo';
      btn.innerHTML = savedSlugs.has(slug) ? '&#9733;' : '&#9734;';
    }
    const card = btn?.closest('.spell-card');
    if (card) card.classList.toggle('saved', savedSlugs.has(slug));
    // update modal bookmark if open
    syncModalBookmark(slug);
  }
}

function updateSavedBadge() {
  const badge = document.getElementById('saved-count-badge');
  badge.textContent = savedSlugs.size;
  badge.classList.toggle('hidden', savedSlugs.size === 0);
}

function syncModalBookmark(slug) {
  const btn = document.getElementById('modal-bookmark-btn');
  if (!btn || btn.dataset.slug !== slug) return;
  const isSaved = savedSlugs.has(slug);
  btn.classList.toggle('saved', isSaved);
  btn.title = isSaved ? 'Rimuovi dai salvati' : 'Salva incantesimo';
  btn.innerHTML = isSaved ? '&#9733; Salvato' : '&#9734; Salva';
}

// ─── View switching ──────────────────────────────────────────────────────────
function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  const sidebar = document.getElementById('sidebar');
  const layout  = sidebar.closest('.layout');
  if (view === 'saved') {
    sidebar.classList.add('hidden');
    layout.classList.add('full-width');
    document.getElementById('results-label').innerHTML = 'Incantesimi salvati: <span id="count">0</span>';
  } else {
    sidebar.classList.remove('hidden');
    layout.classList.remove('full-width');
    document.getElementById('results-label').innerHTML = 'Incantesimi trovati: <span id="count">0</span>';
  }
  render();
}

// ─── Build filter UI ─────────────────────────────────────────────────────────
function buildFilters() {
  const classes = new Set(), levels = new Set(), schools = new Set(), actions = new Set();
  allSpells.forEach(s => {
    (s.classes || []).forEach(c => classes.add(c));
    levels.add(s.level);
    if (s.school)       schools.add(s.school);
    if (s.action_type)  actions.add(s.action_type);
  });

  renderFilterGroup('filter-class',  [...classes].sort(),       c => classIt(c),   filters.classes, toggleClass);
  renderFilterGroup('filter-level',  [...levels].sort((a,b) => a-b), l => levelLabel(l), filters.levels, toggleLevel);
  renderFilterGroup('filter-school', [...schools].sort(),       s => schoolIt(s),  filters.schools, toggleSchool);
  renderFilterGroup('filter-action', [...actions].sort(),       a => actionIt(a),  filters.actions, toggleAction);
}

function renderFilterGroup(containerId, values, labelFn, activeSet, toggleFn) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  values.forEach(v => {
    const count = countFor(containerId, v);
    const label = document.createElement('label');
    label.className = 'filter-label';
    const id = `chk-${containerId}-${v}`;
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${v}" ${activeSet.has(String(v)) ? 'checked' : ''}>
      <span class="checkbox-custom"></span>
      <span class="filter-label-text">${labelFn(v)}</span>
      <span class="filter-count" data-key="${containerId}-${v}">${count}</span>`;
    label.querySelector('input').addEventListener('change', e => {
      toggleFn(String(v), e.target.checked);
    });
    container.appendChild(label);
  });
}

function countFor(groupId, value) {
  return allSpells.filter(s => {
    if (groupId === 'filter-class')  return (s.classes||[]).includes(value);
    if (groupId === 'filter-level')  return s.level === value;
    if (groupId === 'filter-school') return s.school === value;
    if (groupId === 'filter-action') return s.action_type === value;
    return false;
  }).length;
}

// ─── Toggle handlers ─────────────────────────────────────────────────────────
function toggleClass(v, on)  { on ? filters.classes.add(v)  : filters.classes.delete(v);  render(); }
function toggleLevel(v, on)  { on ? filters.levels.add(v)   : filters.levels.delete(v);   render(); }
function toggleSchool(v, on) { on ? filters.schools.add(v)  : filters.schools.delete(v);  render(); }
function toggleAction(v, on) { on ? filters.actions.add(v)  : filters.actions.delete(v);  render(); }

// ─── Filtering & sorting ─────────────────────────────────────────────────────
function filteredSpells() {
  const pool = currentView === 'saved'
    ? allSpells.filter(s => savedSlugs.has(s.slug))
    : allSpells;

  const q = searchQuery.toLowerCase().trim();
  return pool.filter(s => {
    if (q && !(s.name_it?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q))) return false;
    if (currentView === 'saved') return true; // no extra filters in saved view
    if (filters.classes.size && !(s.classes||[]).some(c => filters.classes.has(c))) return false;
    if (filters.levels.size  && !filters.levels.has(String(s.level)))  return false;
    if (filters.schools.size && !filters.schools.has(s.school))  return false;
    if (filters.actions.size && !filters.actions.has(s.action_type)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'level')  return a.level - b.level || (a.name_it||'').localeCompare(b.name_it||'');
    if (sortBy === 'school') return (a.school||'').localeCompare(b.school||'') || (a.name_it||'').localeCompare(b.name_it||'');
    return (a.name_it||'').localeCompare(b.name_it||'');
  });
}

// ─── Render cards ─────────────────────────────────────────────────────────────
function render() {
  const spells = filteredSpells();
  document.getElementById('count').textContent = spells.length;
  const grid = document.getElementById('spell-grid');
  grid.innerHTML = '';

  if (spells.length === 0) {
    const msg = currentView === 'saved'
      ? '<div class="empty-state-icon">&#9734;</div><div class="empty-state-text">Nessun incantesimo salvato.<br>Clicca &#9734; su una card per aggiungerlo.</div>'
      : '<div class="empty-state-icon">&#9760;</div><div class="empty-state-text">Nessun incantesimo trovato</div>';
    grid.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  let lastLevel = null;
  spells.forEach(spell => {
    if (sortBy === 'level' && spell.level !== lastLevel) {
      lastLevel = spell.level;
      const hdr = document.createElement('div');
      hdr.className = 'level-group-header';
      hdr.textContent = levelLabel(spell.level);
      frag.appendChild(hdr);
    }

    const isSaved = savedSlugs.has(spell.slug);
    const card = document.createElement('div');
    card.className = `spell-card school-${spell.school || 'unknown'}${isSaved ? ' saved' : ''}`;

    const badges = [
      spell.concentration ? '<span class="badge badge-concentration">Concentrazione</span>' : '',
      spell.ritual        ? '<span class="badge badge-ritual">Rituale</span>' : '',
    ].filter(Boolean).join('');

    const classes = (spell.classes||[]).map(c =>
      `<span class="class-pill class-${c}">${classIt(c)}</span>`
    ).join('');

    const components = (spell.components||[]).join(', ');

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-name">${spell.name_it || spell.name}</div>
          ${spell.name_it !== spell.name ? `<div class="card-name-en">${spell.name}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0">
          <button class="btn-bookmark${isSaved ? ' saved' : ''}" data-slug="${spell.slug}"
            title="${isSaved ? 'Rimuovi dai salvati' : 'Salva incantesimo'}">
            ${isSaved ? '&#9733;' : '&#9734;'}
          </button>
          <div class="card-level-badge">${levelLabel(spell.level)}</div>
        </div>
      </div>
      <div class="card-meta">
        <span class="card-school school-${spell.school}">${schoolIt(spell.school)}</span>
        <span class="card-action">${actionIt(spell.action_type)}</span>
      </div>
      ${badges ? `<div class="card-badges">${badges}</div>` : ''}
      <div class="card-classes">${classes}</div>
      ${components ? `<div class="card-components">Componenti: <strong>${components}</strong></div>` : ''}
    `;

    card.querySelector('.btn-bookmark').addEventListener('click', e => toggleSaved(spell.slug, e));
    card.addEventListener('click', () => openModal(spell));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(spell) {
  const overlay  = document.getElementById('modal-overlay');
  const topBar   = document.getElementById('modal-top-bar');
  const body     = document.getElementById('modal-body');

  topBar.className = `modal-top-bar school-${spell.school}`;
  const schoolColors = {
    abjuration:'#5b9bd5', conjuration:'#e8a030', divination:'#85c1e9',
    enchantment:'#d98ce8', evocation:'#e85555', illusion:'#9b59b6',
    necromancy:'#2ecc71', transmutation:'#c9a84c',
  };
  topBar.style.background = schoolColors[spell.school] || '#7c5cbf';

  const components = (spell.components||[]).join(', ');
  const classes    = (spell.classes||[]).map(c => `<span class="class-pill class-${c}">${classIt(c)}</span>`).join('');
  const isSaved    = savedSlugs.has(spell.slug);

  const badges = [
    spell.concentration ? '<span class="badge badge-concentration">Concentrazione</span>' : '',
    spell.ritual        ? '<span class="badge badge-ritual">Rituale</span>'               : '',
    spell.attack_roll   ? '<span class="badge" style="background:rgba(232,85,85,.12);color:#e85555;border:1px solid rgba(232,85,85,.3)">Tiro per colpire</span>' : '',
  ].filter(Boolean).join('');

  const stats = [
    ['Livello',    levelLabel(spell.level)],
    ['Scuola',     schoolIt(spell.school)],
    ['Azione',     actionIt(spell.action_type)],
    ['Gittata',    spell.range || '—'],
    ['Durata',     spell.duration || '—'],
    ['Componenti', components || '—'],
    spell.saving_throw   ? ['Tiro Salvezza', spell.saving_throw]   : null,
    spell.damage         ? ['Danno', spell.damage]                  : null,
    spell.area_of_effect ? ['Area', spell.area_of_effect]           : null,
  ].filter(Boolean);

  const statsHtml = stats.map(([label, val]) => `
    <div class="stat-item">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${val}</div>
    </div>`).join('');

  body.innerHTML = `
    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
      <div>
        <div class="modal-title">${spell.name_it || spell.name}</div>
        ${spell.name_it !== spell.name ? `<div class="modal-title-en">${spell.name}</div>` : ''}
      </div>
      <button id="modal-bookmark-btn" data-slug="${spell.slug}"
        class="btn-bookmark${isSaved ? ' saved' : ''}"
        title="${isSaved ? 'Rimuovi dai salvati' : 'Salva incantesimo'}"
        style="font-size:1.3rem;padding:.25rem .5rem;border:1px solid var(--border);border-radius:6px;margin-top:.2rem">
        ${isSaved ? '&#9733; Salvato' : '&#9734; Salva'}
      </button>
    </div>

    <div class="modal-tags">
      <span class="card-school school-${spell.school}">${schoolIt(spell.school)}</span>
      ${badges}
    </div>

    <div class="card-classes" style="margin-bottom:.75rem">${classes}</div>

    <div class="modal-stats">${statsHtml}</div>

    ${spell.material ? `<div class="modal-material"><strong>Materiale:</strong> ${spell.material}</div>` : ''}

    ${spell.description_it ? `
      <div style="margin-top:1.25rem">
        <div class="modal-desc-title">Descrizione</div>
        <div class="modal-desc">${spell.description_it.replace(/\n/g,'<br>')}</div>
      </div>` : ''}

    ${spell.higher_level_slot ? `
      <div class="modal-higher">
        <div class="modal-desc-title">Slot di Livello Superiore</div>
        <div class="modal-desc">${spell.higher_level_slot}</div>
      </div>` : ''}

    ${spell.cantrip_upgrade && !spell.higher_level_slot ? `
      <div class="modal-higher">
        <div class="modal-desc-title">Trucchetto Potenziato</div>
        <div class="modal-desc">${spell.cantrip_upgrade}</div>
      </div>` : ''}
  `;

  document.getElementById('modal-bookmark-btn').addEventListener('click', e => {
    toggleSaved(spell.slug, e);
    syncModalBookmark(spell.slug);
  });

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value;
  render();
});

document.getElementById('sort-select').addEventListener('change', e => {
  sortBy = e.target.value;
  render();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  filters.classes.clear();
  filters.levels.clear();
  filters.schools.clear();
  filters.actions.clear();
  searchQuery = '';
  document.getElementById('search').value = '';
  document.querySelectorAll('.filter-options input[type=checkbox]').forEach(cb => cb.checked = false);
  render();
});

document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => setView(tab.dataset.view));
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('incantesimi_db.json');
    allSpells = await res.json();
    buildFilters();
    updateSavedBadge();
    render();
  } catch (err) {
    document.getElementById('spell-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#9888;</div>
        <div class="empty-state-text">Errore nel caricamento degli incantesimi.<br>
          Apri il sito tramite un server locale (es. <code>npx serve .</code>).</div>
      </div>`;
    console.error(err);
  }
}

init();
