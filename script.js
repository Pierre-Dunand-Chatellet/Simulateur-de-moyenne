const STORAGE_KEY = 'simulateur-bac-rows';

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

function loadRows() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return [{ name: '', coef: 1, note: '', pending: false }];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
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
        <input type="number" class="f-note" min="0" max="20" step="0.1" inputmode="decimal" aria-label="Note sur 20" value="${escapeHtml(row.note)}" ${row.pending ? 'disabled' : ''}>
      </td>
      <td class="c-flag">
        <span class="cell-label">À venir</span>
        <input type="checkbox" class="f-pending" aria-label="Épreuve à venir" ${row.pending ? 'checked' : ''}>
      </td>
      <td class="c-del">
        <button type="button" class="del-btn" aria-label="Supprimer cette matière">×</button>
      </td>
    `;

    tr.querySelector('.f-name').oninput = e => { row.name = e.target.value; save(); };
    tr.querySelector('.f-coef').oninput = e => { row.coef = e.target.value; save(); update(); };
    tr.querySelector('.f-note').oninput = e => { row.note = e.target.value; save(); update(); };
    tr.querySelector('.f-pending').onchange = e => {
      row.pending = e.target.checked;
      save(); render(); update();
    };
    tr.querySelector('.del-btn').onclick = () => {
      rows.splice(i, 1); save(); render(); update();
    };

    body.appendChild(tr);
  });

  document.getElementById('empty-state').hidden = rows.length > 0;
}

function update() {
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
  valueEl.textContent = avg.value.toFixed(2).replace('.', ',');
  metaEl.textContent = `${avg.count} matière${avg.count > 1 ? 's' : ''} notée${avg.count > 1 ? 's' : ''}, coefficient total ${avg.coefSum}`;
  mentionEl.textContent = MENTIONS.find(m => avg.value >= m.min).label;
  mentionEl.hidden = false;
}

function setResult(text, state) {
  const el = document.getElementById('target-result');
  el.innerHTML = text;
  el.className = 'field-result' + (state ? ' is-' + state : '');
}

document.getElementById('add-row').onclick = () => {
  rows.push({ name: '', coef: 1, note: '', pending: false });
  save(); render(); update();
  const inputs = document.querySelectorAll('.f-name');
  inputs[inputs.length - 1].focus();
};

document.getElementById('clear-all').onclick = () => {
  rows = [];
  save(); render(); update();
  setResult('', null);
};

document.getElementById('prefill').onclick = () => {
  rows = [...BAC.finales, ...BAC.continu]
    .map(m => ({ name: m.name, coef: m.coef, note: '', pending: true }));
  save(); render(); update();
  setResult('', null);
};

document.getElementById('solve').onclick = () => {
  const target = parseFloat(document.getElementById('target').value);

  if (isNaN(target)) {
    setResult('Renseigne un objectif entre 0 et 20.', 'bad');
    return;
  }

  const pendingCoef = rows.filter(r => r.pending).reduce((s, r) => s + num(r.coef), 0);
  if (pendingCoef === 0) {
    setResult('Coche au moins une matière « à venir » pour savoir ce qu\'il te reste à faire.', 'bad');
    return;
  }

  const graded = rows.filter(isGraded);
  const knownCoef = graded.reduce((s, r) => s + num(r.coef), 0);
  const knownPoints = graded.reduce((s, r) => s + parseFloat(r.note) * num(r.coef), 0);
  const needed = (target * (knownCoef + pendingCoef) - knownPoints) / pendingCoef;

  if (needed > 20) {
    setResult(`Hors d'atteinte : il faudrait <strong>${needed.toFixed(2).replace('.', ',')}</strong> de moyenne sur les épreuves restantes.`, 'bad');
  } else if (needed <= 0) {
    setResult('Objectif déjà atteint, même avec 0 sur tout le reste.', 'ok');
  } else {
    setResult(`Il te faut <strong>${needed.toFixed(2).replace('.', ',')}</strong> de moyenne sur les épreuves restantes.`, 'ok');
  }
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

render();
update();
