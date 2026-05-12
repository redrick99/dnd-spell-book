'use strict';

// ─── Language & i18n ─────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('spellLang') || 'it';

const STRINGS = {
  it: {
    title:            'Libro degli Incantesimi',
    dbFile:           'incantesimi_db.json',
    filters:          '◆ Filtri',
    searchPlaceholder:'Cerca incantesimo...',
    filterClass:      'Classe',
    filterLevel:      'Livello',
    filterSchool:     'Scuola',
    filterAction:     'Tipo di Azione',
    resetBtn:         '✖ Azzera filtri',
    sortName:         'Nome A–Z',
    sortLevel:        'Livello',
    sortSchool:       'Scuola',
    tabAll:           'Tutti gli Incantesimi',
    tabSaved:         'Salvati',
    resultsFound:     'Incantesimi trovati',
    resultsSaved:     'Incantesimi salvati',
    emptyNoResults:   'Nessun incantesimo trovato',
    emptyNoSaved:     'Nessun incantesimo salvato.<br>Clicca ☆ su una card per aggiungerlo.',
    concentration:    'Concentrazione',
    ritual:           'Rituale',
    attackRoll:       'Tiro per colpire',
    bookmarkSave:     'Salva incantesimo',
    bookmarkRemove:   'Rimuovi dai salvati',
    bookmarkSaved:    '&#9733; Salvato',
    bookmarkUnsaved:  '&#9734; Salva',
    statLevel:        'Livello',
    statSchool:       'Scuola',
    statAction:       'Azione',
    statRange:        'Gittata',
    statDuration:     'Durata',
    statComponents:   'Componenti',
    statSavingThrow:  'Tiro Salvezza',
    statDamage:       'Danno',
    statArea:         'Area',
    modalMaterial:    'Materiale:',
    modalDescription: 'Descrizione',
    modalHigherLevel: 'Slot di Livello Superiore',
    modalCantripUpgrade: 'Trucchetto Potenziato',
    cardComponents:   'Componenti:',
    loadError:        'Errore nel caricamento degli incantesimi.<br>Apri il sito tramite un server locale (es. <code>npx serve .</code>).',
  },
  en: {
    title:            'Spell Book',
    dbFile:           'spells_db.json',
    filters:          '◆ Filters',
    searchPlaceholder:'Search spell...',
    filterClass:      'Class',
    filterLevel:      'Level',
    filterSchool:     'School',
    filterAction:     'Action Type',
    resetBtn:         '✖ Reset filters',
    sortName:         'Name A–Z',
    sortLevel:        'Level',
    sortSchool:       'School',
    tabAll:           'All Spells',
    tabSaved:         'Saved',
    resultsFound:     'Spells found',
    resultsSaved:     'Saved spells',
    emptyNoResults:   'No spells found',
    emptyNoSaved:     'No saved spells.<br>Click ☆ on a card to add one.',
    concentration:    'Concentration',
    ritual:           'Ritual',
    attackRoll:       'Attack Roll',
    bookmarkSave:     'Save spell',
    bookmarkRemove:   'Remove from saved',
    bookmarkSaved:    '&#9733; Saved',
    bookmarkUnsaved:  '&#9734; Save',
    statLevel:        'Level',
    statSchool:       'School',
    statAction:       'Action',
    statRange:        'Range',
    statDuration:     'Duration',
    statComponents:   'Components',
    statSavingThrow:  'Saving Throw',
    statDamage:       'Damage',
    statArea:         'Area',
    modalMaterial:    'Material:',
    modalDescription: 'Description',
    modalHigherLevel: 'Higher-Level Slots',
    modalCantripUpgrade: 'Cantrip Upgrade',
    cardComponents:   'Components:',
    loadError:        'Error loading spells.<br>Open the site via a local server (e.g. <code>npx serve .</code>).',
  },
};

const LEVEL_LABELS = {
  it: { 0:'Trucchetto', 1:'1° Livello', 2:'2° Livello', 3:'3° Livello', 4:'4° Livello', 5:'5° Livello', 6:'6° Livello', 7:'7° Livello', 8:'8° Livello', 9:'9° Livello' },
  en: { 0:'Cantrip', 1:'1st Level', 2:'2nd Level', 3:'3rd Level', 4:'4th Level', 5:'5th Level', 6:'6th Level', 7:'7th Level', 8:'8th Level', 9:'9th Level' },
};

const SCHOOL_LABELS = {
  it: { abjuration:'Abiurazione', conjuration:'Congiurazione', divination:'Divinazione', enchantment:'Ammaliamento', evocation:'Evocazione', illusion:'Illusione', necromancy:'Negromanzia', transmutation:'Trasmutazione' },
  en: { abjuration:'Abjuration', conjuration:'Conjuration', divination:'Divination', enchantment:'Enchantment', evocation:'Evocation', illusion:'Illusion', necromancy:'Necromancy', transmutation:'Transmutation' },
};

const ACTION_LABELS = {
  it: { action:'Azione', bonus_action:'Azione Bonus', reaction:'Reazione', '1 minute':'1 Minuto', '10 minutes':'10 Minuti', '1 hour':'1 Ora', special:'Speciale' },
  en: { action:'Action', bonus_action:'Bonus Action', reaction:'Reaction', '1 minute':'1 Minute', '10 minutes':'10 Minutes', '1 hour':'1 Hour', special:'Special' },
};

const CLASS_LABELS = {
  it: { bard:'Bardo', cleric:'Chierico', druid:'Druido', paladin:'Paladino', ranger:'Ranger', sorcerer:'Stregone', warlock:'Warlock', wizard:'Mago', artificer:'Artefice', fighter:'Guerriero', rogue:'Ladro' },
  en: { bard:'Bard', cleric:'Cleric', druid:'Druid', paladin:'Paladin', ranger:'Ranger', sorcerer:'Sorcerer', warlock:'Warlock', wizard:'Wizard', artificer:'Artificer', fighter:'Fighter', rogue:'Rogue' },
};

// ─── Data & State ─────────────────────────────────────────────────────────────
let allSpells = [];
const DB_CACHE = {};
const filters = { classes: new Set(), levels: new Set(), schools: new Set(), actions: new Set() };
let searchQuery = '';
let sortBy = 'name';
let currentView = 'all';
let savedSlugs = new Set(JSON.parse(localStorage.getItem(`savedSpells_${currentLang}`) || '[]'));

// ─── Label helpers ────────────────────────────────────────────────────────────
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function levelLabel(l) { return LEVEL_LABELS[currentLang][l] ?? `${l}°`; }
function schoolLabel(s) { return SCHOOL_LABELS[currentLang][s] ?? capitalize(s); }
function actionLabel(a) { return ACTION_LABELS[currentLang][a] ?? capitalize(a?.replace(/_/g, ' ') ?? ''); }
function classLabel(c)  { return CLASS_LABELS[currentLang][c] ?? capitalize(c); }
function spellName(s)   { return currentLang === 'it' ? (s.name_it || s.name) : s.name; }
function spellDesc(s)   { return currentLang === 'it' ? (s.description_it || s.description) : (s.description || s.description_it); }

// ─── English DB normalization ─────────────────────────────────────────────────
function normalizeEnglishSpell(s) {
  const actionType = s.castingTime
    ? s.castingTime.toLowerCase()
    : (s.actionType === 'bonusAction' ? 'bonus_action' : (s.actionType || null));
  return {
    slug:             s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    name:             s.name,
    name_it:          null,
    level:            s.level,
    school:           (s.school || '').toLowerCase(),
    classes:          s.classes || [],
    action_type:      actionType,
    concentration:    s.concentration || false,
    ritual:           s.ritual || false,
    range:            s.range || null,
    components:       (s.components || []).map(c => c.toUpperCase()),
    material:         s.material || null,
    duration:         s.duration || null,
    description:      s.description || null,
    description_it:   null,
    cantrip_upgrade:  s.cantripUpgrade || null,
    higher_level_slot:s.higherLevelSlot || null,
    saving_throw:     null,
    attack_roll:      false,
    damage:           null,
    area_of_effect:   null,
  };
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadSpells() {
  if (DB_CACHE[currentLang]) return DB_CACHE[currentLang];
  const res = await fetch(STRINGS[currentLang].dbFile);
  const raw = await res.json();
  DB_CACHE[currentLang] = currentLang === 'en' ? raw.map(normalizeEnglishSpell) : raw;
  return DB_CACHE[currentLang];
}

// ─── Saved spells ─────────────────────────────────────────────────────────────
function persistSaved() {
  localStorage.setItem(`savedSpells_${currentLang}`, JSON.stringify([...savedSlugs]));
}

function toggleSaved(slug, e) {
  e.stopPropagation();
  const t = STRINGS[currentLang];
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
    const btn = document.querySelector(`.btn-bookmark[data-slug="${slug}"]`);
    if (btn) {
      btn.classList.toggle('saved', savedSlugs.has(slug));
      btn.title = savedSlugs.has(slug) ? t.bookmarkRemove : t.bookmarkSave;
      btn.innerHTML = savedSlugs.has(slug) ? '&#9733;' : '&#9734;';
    }
    const card = btn?.closest('.spell-card');
    if (card) card.classList.toggle('saved', savedSlugs.has(slug));
    syncModalBookmark(slug);
  }
}

function updateSavedBadge() {
  const badge = document.getElementById('saved-count-badge');
  badge.textContent = savedSlugs.size;
  badge.classList.toggle('hidden', savedSlugs.size === 0);
}

function syncModalBookmark(slug) {
  const t = STRINGS[currentLang];
  const btn = document.getElementById('modal-bookmark-btn');
  if (!btn || btn.dataset.slug !== slug) return;
  const isSaved = savedSlugs.has(slug);
  btn.classList.toggle('saved', isSaved);
  btn.title = isSaved ? t.bookmarkRemove : t.bookmarkSave;
  btn.innerHTML = isSaved ? t.bookmarkSaved : t.bookmarkUnsaved;
}

// ─── Language switching ───────────────────────────────────────────────────────
async function switchLanguage(lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem('spellLang', lang);
  savedSlugs = new Set(JSON.parse(localStorage.getItem(`savedSpells_${currentLang}`) || '[]'));

  filters.classes.clear(); filters.levels.clear(); filters.schools.clear(); filters.actions.clear();
  searchQuery = '';
  document.getElementById('search').value = '';
  sortBy = 'name';
  document.getElementById('sort-select').value = 'name';
  currentView = 'all';
  document.getElementById('sidebar').classList.remove('hidden');
  document.querySelector('.layout').classList.remove('full-width');
  document.querySelectorAll('.view-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === 'all'));

  allSpells = await loadSpells();
  applyStrings();
  buildFilters();
  updateSavedBadge();
  render();
}

function applyStrings() {
  const t = STRINGS[currentLang];
  document.documentElement.lang = currentLang;
  document.title = `${t.title} — D&D 2024`;
  document.getElementById('header-title').textContent = `◆ ${t.title} ◆`;
  document.getElementById('sidebar-title').textContent = t.filters;
  document.getElementById('search').placeholder = t.searchPlaceholder;
  document.querySelector('#group-class .filter-group-title').textContent = t.filterClass;
  document.querySelector('#group-level .filter-group-title').textContent = t.filterLevel;
  document.querySelector('#group-school .filter-group-title').textContent = t.filterSchool;
  document.querySelector('#group-action .filter-group-title').textContent = t.filterAction;
  document.getElementById('btn-reset').textContent = t.resetBtn;
  const sortSel = document.getElementById('sort-select');
  sortSel.options[0].text = t.sortName;
  sortSel.options[1].text = t.sortLevel;
  sortSel.options[2].text = t.sortSchool;
  document.getElementById('tab-all').textContent = t.tabAll;
  document.getElementById('tab-saved-text').textContent = t.tabSaved;
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
  updateResultsLabel();
}

function updateResultsLabel() {
  const t = STRINGS[currentLang];
  const label = currentView === 'saved' ? t.resultsSaved : t.resultsFound;
  document.getElementById('results-label').innerHTML = `${label}: <span id="count">0</span>`;
}

// ─── View switching ───────────────────────────────────────────────────────────
function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  const sidebar = document.getElementById('sidebar');
  const layout  = sidebar.closest('.layout');
  if (view === 'saved') {
    sidebar.classList.add('hidden');
    layout.classList.add('full-width');
  } else {
    sidebar.classList.remove('hidden');
    layout.classList.remove('full-width');
  }
  updateResultsLabel();
  render();
}

// ─── Build filter UI ──────────────────────────────────────────────────────────
function buildFilters() {
  const classes = new Set(), levels = new Set(), schools = new Set(), actions = new Set();
  allSpells.forEach(s => {
    (s.classes || []).forEach(c => classes.add(c));
    levels.add(s.level);
    if (s.school)       schools.add(s.school);
    if (s.action_type)  actions.add(s.action_type);
  });

  renderFilterGroup('filter-class',  [...classes].sort(),            c => classLabel(c),  filters.classes, toggleClass);
  renderFilterGroup('filter-level',  [...levels].sort((a,b) => a-b), l => levelLabel(l),  filters.levels,  toggleLevel);
  renderFilterGroup('filter-school', [...schools].sort(),            s => schoolLabel(s), filters.schools, toggleSchool);
  renderFilterGroup('filter-action', [...actions].sort(),            a => actionLabel(a), filters.actions, toggleAction);
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

// ─── Toggle handlers ──────────────────────────────────────────────────────────
function toggleClass(v, on)  { on ? filters.classes.add(v)  : filters.classes.delete(v);  render(); }
function toggleLevel(v, on)  { on ? filters.levels.add(v)   : filters.levels.delete(v);   render(); }
function toggleSchool(v, on) { on ? filters.schools.add(v)  : filters.schools.delete(v);  render(); }
function toggleAction(v, on) { on ? filters.actions.add(v)  : filters.actions.delete(v);  render(); }

// ─── Filtering & sorting ──────────────────────────────────────────────────────
function filteredSpells() {
  const pool = currentView === 'saved'
    ? allSpells.filter(s => savedSlugs.has(s.slug))
    : allSpells;

  const q = searchQuery.toLowerCase().trim();
  return pool.filter(s => {
    if (q && !spellName(s).toLowerCase().includes(q)) return false;
    if (currentView === 'saved') return true;
    if (filters.classes.size && !(s.classes||[]).some(c => filters.classes.has(c))) return false;
    if (filters.levels.size  && !filters.levels.has(String(s.level)))  return false;
    if (filters.schools.size && !filters.schools.has(s.school))  return false;
    if (filters.actions.size && !filters.actions.has(s.action_type)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'level')  return a.level - b.level || spellName(a).localeCompare(spellName(b));
    if (sortBy === 'school') return (a.school||'').localeCompare(b.school||'') || spellName(a).localeCompare(spellName(b));
    return spellName(a).localeCompare(spellName(b));
  });
}

// ─── Render cards ─────────────────────────────────────────────────────────────
function render() {
  const t = STRINGS[currentLang];
  const spells = filteredSpells();
  document.getElementById('count').textContent = spells.length;
  const grid = document.getElementById('spell-grid');
  grid.innerHTML = '';

  if (spells.length === 0) {
    const msg = currentView === 'saved'
      ? `<div class="empty-state-icon">&#9734;</div><div class="empty-state-text">${t.emptyNoSaved}</div>`
      : `<div class="empty-state-icon">&#9760;</div><div class="empty-state-text">${t.emptyNoResults}</div>`;
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

    const isSaved  = savedSlugs.has(spell.slug);
    const mainName = spellName(spell);
    const subName  = currentLang === 'it' && spell.name && spell.name !== mainName ? spell.name : null;

    const card = document.createElement('div');
    card.className = `spell-card school-${spell.school || 'unknown'}${isSaved ? ' saved' : ''}`;

    const badges = [
      spell.concentration ? `<span class="badge badge-concentration">${t.concentration}</span>` : '',
      spell.ritual        ? `<span class="badge badge-ritual">${t.ritual}</span>`               : '',
    ].filter(Boolean).join('');

    const classes = (spell.classes||[]).map(c =>
      `<span class="class-pill class-${c}">${classLabel(c)}</span>`
    ).join('');

    const components = (spell.components||[]).join(', ');

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-name">${mainName}</div>
          ${subName ? `<div class="card-name-en">${subName}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0">
          <button class="btn-bookmark${isSaved ? ' saved' : ''}" data-slug="${spell.slug}"
            title="${isSaved ? t.bookmarkRemove : t.bookmarkSave}">
            ${isSaved ? '&#9733;' : '&#9734;'}
          </button>
          <div class="card-level-badge">${levelLabel(spell.level)}</div>
        </div>
      </div>
      <div class="card-meta">
        <span class="card-school school-${spell.school}">${schoolLabel(spell.school)}</span>
        <span class="card-action">${actionLabel(spell.action_type)}</span>
      </div>
      ${badges ? `<div class="card-badges">${badges}</div>` : ''}
      <div class="card-classes">${classes}</div>
      ${components ? `<div class="card-components">${t.cardComponents} <strong>${components}</strong></div>` : ''}
    `;

    card.querySelector('.btn-bookmark').addEventListener('click', e => toggleSaved(spell.slug, e));
    card.addEventListener('click', () => openModal(spell));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(spell) {
  const t       = STRINGS[currentLang];
  const overlay = document.getElementById('modal-overlay');
  const topBar  = document.getElementById('modal-top-bar');
  const body    = document.getElementById('modal-body');

  topBar.className = `modal-top-bar school-${spell.school}`;
  const schoolColors = {
    abjuration:'#5b9bd5', conjuration:'#e8a030', divination:'#85c1e9',
    enchantment:'#d98ce8', evocation:'#e85555', illusion:'#9b59b6',
    necromancy:'#2ecc71', transmutation:'#c9a84c',
  };
  topBar.style.background = schoolColors[spell.school] || '#7c5cbf';

  const components = (spell.components||[]).join(', ');
  const classes    = (spell.classes||[]).map(c => `<span class="class-pill class-${c}">${classLabel(c)}</span>`).join('');
  const isSaved    = savedSlugs.has(spell.slug);
  const mainName   = spellName(spell);
  const subName    = currentLang === 'it' && spell.name && spell.name !== mainName ? spell.name : null;
  const desc       = spellDesc(spell);

  const badges = [
    spell.concentration ? `<span class="badge badge-concentration">${t.concentration}</span>`  : '',
    spell.ritual        ? `<span class="badge badge-ritual">${t.ritual}</span>`                : '',
    spell.attack_roll   ? `<span class="badge" style="background:rgba(232,85,85,.12);color:#e85555;border:1px solid rgba(232,85,85,.3)">${t.attackRoll}</span>` : '',
  ].filter(Boolean).join('');

  const stats = [
    [t.statLevel,      levelLabel(spell.level)],
    [t.statSchool,     schoolLabel(spell.school)],
    [t.statAction,     actionLabel(spell.action_type)],
    [t.statRange,      spell.range    || '—'],
    [t.statDuration,   spell.duration || '—'],
    [t.statComponents, components     || '—'],
    spell.saving_throw   ? [t.statSavingThrow, spell.saving_throw]   : null,
    spell.damage         ? [t.statDamage,       spell.damage]          : null,
    spell.area_of_effect ? [t.statArea,         spell.area_of_effect]  : null,
  ].filter(Boolean);

  const statsHtml = stats.map(([label, val]) => `
    <div class="stat-item">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${val}</div>
    </div>`).join('');

  body.innerHTML = `
    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
      <div>
        <div class="modal-title">${mainName}</div>
        ${subName ? `<div class="modal-title-en">${subName}</div>` : ''}
      </div>
      <button id="modal-bookmark-btn" data-slug="${spell.slug}"
        class="btn-bookmark${isSaved ? ' saved' : ''}"
        title="${isSaved ? t.bookmarkRemove : t.bookmarkSave}"
        style="font-size:1.3rem;padding:.25rem .5rem;border:1px solid var(--border);border-radius:6px;margin-top:.2rem">
        ${isSaved ? t.bookmarkSaved : t.bookmarkUnsaved}
      </button>
    </div>

    <div class="modal-tags">
      <span class="card-school school-${spell.school}">${schoolLabel(spell.school)}</span>
      ${badges}
    </div>

    <div class="card-classes" style="margin-bottom:.75rem">${classes}</div>

    <div class="modal-stats">${statsHtml}</div>

    ${spell.material ? `<div class="modal-material"><strong>${t.modalMaterial}</strong> ${spell.material}</div>` : ''}

    ${desc ? `
      <div style="margin-top:1.25rem">
        <div class="modal-desc-title">${t.modalDescription}</div>
        <div class="modal-desc">${desc.replace(/\n/g,'<br>')}</div>
      </div>` : ''}

    ${spell.higher_level_slot ? `
      <div class="modal-higher">
        <div class="modal-desc-title">${t.modalHigherLevel}</div>
        <div class="modal-desc">${spell.higher_level_slot}</div>
      </div>` : ''}

    ${spell.cantrip_upgrade && !spell.higher_level_slot ? `
      <div class="modal-higher">
        <div class="modal-desc-title">${t.modalCantripUpgrade}</div>
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

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function init() {
  applyStrings();
  try {
    allSpells = await loadSpells();
    buildFilters();
    updateSavedBadge();
    render();
  } catch (err) {
    const t = STRINGS[currentLang];
    document.getElementById('spell-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#9888;</div>
        <div class="empty-state-text">${t.loadError}</div>
      </div>`;
    console.error(err);
  }
}

init();
