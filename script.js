const STORAGE_KEY = 'simulateur-bac-rows';
const OBJECTIF_KEY = 'simulateur-bac-objectif';

const BAC = {
  finales: [
    { name: 'Français écrit', coef: 5, note: 'passé en 1re' },
    { name: 'Français oral', coef: 5, note: 'passé en 1re' },
    { name: 'Mathématiques', coef: 2, note: 'épreuve anticipée de 1re' },
    { name: 'Philosophie', coef: 8 },
    { name: 'Grand oral', coef: 8 },
    { name: 'Spécialité 1', coef: 16 },
    { name: 'Spécialité 2', coef: 16 }
  ],
  continu: [
    { name: 'Histoire-géographie', coef: 6 },
    { name: 'Langue vivante A', coef: 6 },
    { name: 'Langue vivante B', coef: 6 },
    { name: 'Enseignement scientifique', coef: 6 },
    { name: 'EPS', coef: 6 },
    { name: 'Spécialité de 1re', coef: 8, note: 'celle abandonnée en fin de 1re' },
    { name: 'Enseignement moral et civique', coef: 2 }
  ]
};

const MENTIONS = [
  { min: 16, label: 'Mention très bien' },
  { min: 14, label: 'Mention bien' },
  { min: 12, label: 'Mention assez bien' },
  { min: 10, label: 'Admis, sans mention' },
  { min: 8, label: 'Rattrapage' },
  { min: 0, label: 'Sous le seuil du rattrapage' }
];

let rows = loadRows();
let objectif = loadObjectif();

function loadRows() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Lecture tolérante : les anciennes sauvegardes n'ont pas de champ "priority".
    if (Array.isArray(saved) && saved.length) {
      return saved.map(r => ({
        name: r.name ?? '',
        coef: r.coef ?? 1,
        note: r.note ?? '',
        pending: r.pending === true,
        priority: r.priority === true
      }));
    }
  } catch {}
  return [{ name: '', coef: 1, note: '', pending: false, priority: false }];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function loadObjectif() {
  try {
    const saved = JSON.parse(localStorage.getItem(OBJECTIF_KEY));
    if (saved && typeof saved === 'object') {
      const e = parseFloat(saved.ecart);
      return {
        target: saved.target == null ? '' : String(saved.target),
        // Écart ramené entre 0 et 5, par pas de 0,5
        ecart: isNaN(e) ? 0 : Math.min(5, Math.max(0, Math.round(e * 2) / 2))
      };
    }
  } catch {}
  return { target: '', ecart: 0 };
}

function saveObjectif() {
  localStorage.setItem(OBJECTIF_KEY, JSON.stringify(objectif));
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Format français à deux décimales : 12.5 -> "12,50"
function fmt(n) {
  return n.toFixed(2).replace('.', ',');
}

// Ramène une saisie entre 0 et 20. Une saisie vide ou invalide reste vide.
function clampNote(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return '';
  const c = Math.min(20, Math.max(0, n));
  return c === n ? String(v).trim() : String(c);
}

// Bornage pendant la frappe : avant, seule la sortie du champ ramenait la
// valeur entre 0 et 20, et on pouvait taper 411 (compté tel quel dans la
// moyenne). Une saisie en cours valide ("", "12.", "15,") n'est pas touchée.
function borneEnDirect(el) {
  const n = parseFloat(el.value);
  if (!isNaN(n) && (n > 20 || n < 0)) el.value = clampNote(el.value);
  return el.value;
}

function isGraded(r) {
  return !r.pending && r.note !== '' && !isNaN(parseFloat(r.note));
}

function computeAverage() {
  const graded = rows.filter(isGraded);
  const coefSum = graded.reduce((s, r) => s + num(r.coef), 0);
  if (coefSum === 0) return null;
  return {
    value: graded.reduce((s, r) => s + parseFloat(r.note) * num(r.coef), 0) / coefSum,
    coefSum,
    count: graded.length
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Colore la partie gauche de la piste d'un curseur (variable CSS --fill).
// Firefox le fait tout seul avec ::-moz-range-progress.
function paintRange(el) {
  const min = parseFloat(el.min), max = parseFloat(el.max);
  const pct = el.classList.contains('is-unset') ? 0 : (el.value - min) / (max - min) * 100;
  el.style.setProperty('--fill', pct + '%');
}

// Place le curseur d'une ligne sur la note saisie.
// Sans note, il attend au milieu, grisé, sans remplissage.
function syncRange(el, note) {
  const n = parseFloat(note);
  if (isNaN(n)) {
    el.value = 10;
    el.classList.add('is-unset');
  } else {
    el.value = Math.min(20, Math.max(0, n));
    el.classList.remove('is-unset');
  }
  paintRange(el);
}

function render() {
  const body = document.getElementById('rows-body');
  body.textContent = '';

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="c-name">
        <span class="cell-label">Matière</span>
        <input type="text" class="f-name" aria-label="Nom de la matière" value="${escapeHtml(row.name)}">
      </td>
      <td class="c-num c-coef">
        <span class="cell-label">Coef</span>
        <input type="number" class="f-coef" min="0" step="0.5" aria-label="Coefficient" value="${escapeHtml(row.coef)}">
      </td>
      <td class="c-num c-note">
        <span class="cell-label">Note /20</span>
        <div class="note-field">
          <input type="number" class="f-note" min="0" max="20" step="0.1" inputmode="decimal" aria-label="Note sur 20" value="${escapeHtml(row.note)}" ${row.pending ? 'disabled' : ''}>
          <input type="range" class="f-note-range" min="0" max="20" step="0.25" aria-label="Note sur 20, curseur" ${row.pending ? 'disabled' : ''}>
        </div>
      </td>
      <td class="c-flag">
        <span class="cell-label">À venir</span>
        <input type="checkbox" class="f-pending" aria-label="Épreuve à venir" ${row.pending ? 'checked' : ''}>
        ${row.pending ? `<button type="button" class="star-btn" aria-pressed="${row.priority}" aria-label="Matière à privilégier" title="Matière à privilégier : l'objectif y vise l'écart en plus">★</button>` : ''}
      </td>
      <td class="c-del">
        <button type="button" class="del-btn" aria-label="Supprimer cette matière">×</button>
      </td>
    `;

    const noteEl = tr.querySelector('.f-note');
    const rangeEl = tr.querySelector('.f-note-range');
    syncRange(rangeEl, row.note);

    tr.querySelector('.f-name').oninput = e => { row.name = e.target.value; save(); update(); };
    tr.querySelector('.f-coef').oninput = e => { row.coef = e.target.value; save(); update(); };
    noteEl.oninput = e => {
      row.note = borneEnDirect(e.target);
      syncRange(rangeEl, row.note);
      save(); update();
    };
    // "change" part à la sortie du champ : on nettoie alors la saisie (espaces, "12.")
    noteEl.onchange = e => {
      row.note = clampNote(e.target.value);
      e.target.value = row.note;
      syncRange(rangeEl, row.note);
      save(); update();
    };
    // Pas de render() ici : reconstruire la ligne casserait le glissement en cours
    rangeEl.oninput = e => {
      row.note = e.target.value;
      noteEl.value = row.note;
      rangeEl.classList.remove('is-unset');
      paintRange(rangeEl);
      save(); update();
    };
    tr.querySelector('.f-pending').onchange = e => {
      row.pending = e.target.checked;
      save(); render(); update();
    };
    const starBtn = tr.querySelector('.star-btn');
    if (starBtn) {
      starBtn.onclick = () => {
        row.priority = !row.priority;
        starBtn.setAttribute('aria-pressed', row.priority);
        save(); update();
      };
    }
    tr.querySelector('.del-btn').onclick = () => {
      rows.splice(i, 1); save(); render(); update();
    };

    body.appendChild(tr);
  });

  document.getElementById('empty-state').hidden = rows.length > 0;
}

function update() {
  // L'objectif dépend des notes : on le recalcule à chaque changement
  refreshTarget();

  const avg = computeAverage();
  const valueEl = document.getElementById('average');
  const metaEl = document.getElementById('average-meta');
  const mentionEl = document.getElementById('mention');

  if (!avg) {
    valueEl.textContent = '0,00';
    valueEl.classList.add('is-empty');
    metaEl.textContent = 'Aucune note saisie';
    mentionEl.hidden = true;
    return;
  }

  valueEl.classList.remove('is-empty');
  valueEl.textContent = fmt(avg.value);
  metaEl.textContent = `${avg.count} matière${avg.count > 1 ? 's' : ''} notée${avg.count > 1 ? 's' : ''}, coefficient total ${avg.coefSum}`;
  // Pendant la frappe, une note négative (avant le bornage) donne une moyenne < 0 :
  // on retombe alors sur la dernière mention au lieu de planter
  mentionEl.textContent = (MENTIONS.find(m => avg.value >= m.min) || MENTIONS[MENTIONS.length - 1]).label;
  mentionEl.hidden = false;
}

function setResult(text, state) {
  const el = document.getElementById('target-result');
  el.innerHTML = text;
  el.className = 'field-result' + (state ? ' is-' + state : '');
}

/* Solveur inverse.
   T  = somme des coefs pris en compte (matières notées + à venir)
   K  = points déjà acquis (note x coef des matières notées)
   Pc = coefs à venir non ★, Pp = coefs à venir ★, d = écart
   Toutes les matières à venir non ★ ont la même note x, les ★ ont x + d :
   x = (objectif.T - K - d.Pp) / (Pc + Pp)
   Sans ★ (ou écart nul), on retombe sur l'ancien calcul : une note commune. */
function solve(target, ecart) {
  if (isNaN(target) || target < 0 || target > 20) return { status: 'invalid' };

  const pending = rows.filter(r => r.pending);
  const stars = pending.filter(r => r.priority);
  const Pp = stars.reduce((s, r) => s + num(r.coef), 0);
  const Pc = pending.filter(r => !r.priority).reduce((s, r) => s + num(r.coef), 0);
  if (Pc + Pp === 0) return { status: 'none' };

  const graded = rows.filter(isGraded);
  const knownCoef = graded.reduce((s, r) => s + num(r.coef), 0);
  const K = graded.reduce((s, r) => s + parseFloat(r.note) * num(r.coef), 0);
  const T = knownCoef + Pc + Pp;
  const d = ecart;

  // Note commune sur toutes les épreuves restantes (comportement d'origine).
  // Si toutes les matières à venir sont ★, l'écart n'a personne à qui s'appliquer.
  if (Pp === 0 || Pc === 0 || d === 0) {
    const needed = (target * T - K) / (Pc + Pp);
    if (needed > 20) return { status: 'unreachable', uniform: true, needed };
    if (needed <= 0) return { status: 'reached' };
    return { status: 'ok', uniform: true, needed };
  }

  const names = stars.map(r => String(r.name).trim() || 'sans nom');
  let others = (target * T - K - d * Pp) / (Pc + Pp);
  let star = others + d;

  // Les ★ ne peuvent pas dépasser 20 : on les bloque et on reporte le reste sur les autres
  if (star > 20) {
    star = 20;
    others = (target * T - K - 20 * Pp) / Pc;
    if (others > 20) return { status: 'unreachable', others, star, names };
    return { status: 'ok', others, star, names, capped: true };
  }

  // Les ★ suffisent : 0 ailleurs, on cherche ce qu'il faut en ★
  if (others < 0) {
    star = (target * T - K) / Pp;
    if (star <= 0) return { status: 'reached' };
    return { status: 'ok', others: 0, star, names, starsOnly: true };
  }

  return { status: 'ok', others, star, names };
}

// Transforme le résultat de solve() en phrase affichée sous l'objectif
function describeSolution(res) {
  const list = res.names ? escapeHtml(res.names.join(', ')) : '';
  switch (res.status) {
    case 'invalid':
      return ['Renseigne un objectif entre 0 et 20.', 'bad'];
    case 'none':
      return ['Coche au moins une matière « à venir » pour savoir ce qu\'il te reste à faire.', 'bad'];
    case 'reached':
      return ['Objectif déjà atteint, même avec 0 sur tout le reste.', 'ok'];
    case 'unreachable':
      if (res.uniform) {
        return [`Hors d'atteinte : il faudrait <strong>${fmt(res.needed)}</strong> de moyenne sur les épreuves restantes.`, 'bad'];
      }
      return [`Hors d'atteinte : même avec <strong>20,00</strong> en ★ (${list}), il faudrait <strong>${fmt(res.others)}</strong> ailleurs.`, 'bad'];
    default:
      if (res.uniform) {
        return [`Il te faut <strong>${fmt(res.needed)}</strong> de moyenne sur les épreuves restantes.`, 'ok'];
      }
      if (res.starsOnly) {
        return [`Il te faut <strong>${fmt(res.star)}</strong> en ★ (${list}), même avec 0 ailleurs.`, 'ok'];
      }
      return [`Il te faut <strong>${fmt(res.others)}</strong> ailleurs et <strong>${fmt(res.star)}</strong> en ★ (${list})` +
        (res.capped ? ', les ★ étant plafonnées à 20.' : '.'), 'ok'];
  }
}

// Recalculé à chaque saisie : un objectif vide efface simplement le résultat
function refreshTarget() {
  const raw = document.getElementById('target').value;
  if (raw === '') {
    setResult('', null);
    return;
  }
  const [text, state] = describeSolution(solve(parseFloat(raw), objectif.ecart));
  setResult(text, state);
}

function showEcart() {
  const el = document.getElementById('ecart');
  document.getElementById('ecart-value').textContent = '+' + String(objectif.ecart).replace('.', ',');
  paintRange(el);
}

document.getElementById('add-row').onclick = () => {
  rows.push({ name: '', coef: 1, note: '', pending: false, priority: false });
  save(); render(); update();
  const inputs = document.querySelectorAll('.f-name');
  inputs[inputs.length - 1].focus();
};

document.getElementById('clear-all').onclick = () => {
  rows = [];
  save(); render(); update();
};

document.getElementById('prefill').onclick = () => {
  rows = [...BAC.finales, ...BAC.continu]
    .map(m => ({ name: m.name, coef: m.coef, note: '', pending: true, priority: false }));
  save(); render(); update();
};

const targetEl = document.getElementById('target');
const ecartEl = document.getElementById('ecart');

targetEl.value = objectif.target;
targetEl.oninput = e => {
  objectif.target = borneEnDirect(e.target);
  saveObjectif(); refreshTarget();
};
// À la sortie du champ, l'objectif est ramené entre 0 et 20
targetEl.onchange = e => {
  objectif.target = clampNote(e.target.value);
  e.target.value = objectif.target;
  saveObjectif(); refreshTarget();
};

ecartEl.value = objectif.ecart;
ecartEl.oninput = e => {
  objectif.ecart = parseFloat(e.target.value);
  showEcart();
  saveObjectif(); refreshTarget();
};

function renderCoefList(id, totalId, items) {
  document.getElementById(id).innerHTML = items.map(m => `
    <li>
      <span>${escapeHtml(m.name)}${m.note ? `<span class="coef-note">${escapeHtml(m.note)}</span>` : ''}</span>
      <span class="coef-val">${m.coef}</span>
    </li>
  `).join('');
  document.getElementById(totalId).textContent = items.reduce((s, m) => s + m.coef, 0);
}

renderCoefList('coef-finales', 'total-finales', BAC.finales);
renderCoefList('coef-continu', 'total-continu', BAC.continu);
document.getElementById('coef-total-all').textContent =
  BAC.finales.concat(BAC.continu).reduce((s, m) => s + m.coef, 0);

showEcart();
render();
update();
