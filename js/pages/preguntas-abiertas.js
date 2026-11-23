// js/pages/preguntas-abiertas.js — NPS y análisis cualitativo de Posgrado.
import {
  pageHeader,
  escapeHTML,
  formatNumber,
  formatPercent,
  emptyState,
  computeNPS,
  questionCard,
  initQuestionCards
} from './pageUtils.js';

function renderNpsCard(nps) {
  if (!nps) {
    return emptyState('Configura la columna NPS en js/config.js para calcular este indicador.', 'fas fa-star');
  }
  return `
    <section class="card nps-card" style="margin-bottom: 20px;">
      <div class="nps-score">
        <span class="nps-label">Net Promoter Score</span>
        <span class="nps-value">${nps.nps > 0 ? '+' : ''}${nps.nps}</span>
        <span class="nps-total">${formatNumber(nps.total)} respuestas válidas (escala 0–10)</span>
      </div>
      <div class="nps-bars">
        <div class="nps-bar">
          <span class="nps-bar-label">Promotores (9–10)</span>
          <div class="nps-bar-track"><div class="nps-bar-fill nps-promoter" style="width:${Math.round((nps.promoters / nps.total) * 100)}%"></div></div>
          <span class="nps-bar-value">${formatNumber(nps.promoters)} (${formatPercent(nps.promoters, nps.total)})</span>
        </div>
        <div class="nps-bar">
          <span class="nps-bar-label">Pasivos (7–8)</span>
          <div class="nps-bar-track"><div class="nps-bar-fill nps-passive" style="width:${Math.round((nps.passives / nps.total) * 100)}%"></div></div>
          <span class="nps-bar-value">${formatNumber(nps.passives)} (${formatPercent(nps.passives, nps.total)})</span>
        </div>
        <div class="nps-bar">
          <span class="nps-bar-label">Detractores (0–6)</span>
          <div class="nps-bar-track"><div class="nps-bar-fill nps-detractor" style="width:${Math.round((nps.detractors / nps.total) * 100)}%"></div></div>
          <span class="nps-bar-value">${formatNumber(nps.detractors)} (${formatPercent(nps.detractors, nps.total)})</span>
        </div>
      </div>
    </section>
  `;
}

export async function loadPreguntasAbiertasPage(container, data) {
  const nps = computeNPS(data);
  const cfg = window.POSGRADO_CONFIG;
  const npsQuestions = (cfg.questions || []).filter(q => q.pagina === 'preguntas-abiertas');
  const openCfg = (cfg.openQuestions || [])[0];

  const textCol = openCfg ? window.DataLoader.resolveColumn(openCfg.column || []) : null;
  const catCol = openCfg?.categoryColumn ? window.DataLoader.resolveColumn(openCfg.categoryColumn) : null;
  const segCol = openCfg?.segmentColumn ? window.DataLoader.resolveColumn(openCfg.segmentColumn) : null;
  const tipoCol = window.DataLoader.getFilterColumn('tipoPrograma');
  const progCol = window.DataLoader.getFilterColumn('programa');

  const rawItems = textCol
    ? data
      .map(row => ({
        text: String(row[textCol] || '').trim(),
        category: catCol ? String(row[catCol] || '').trim() : '',
        segment: segCol ? String(row[segCol] || '').trim() : '',
        tipo: tipoCol ? String(row[tipoCol] || '').trim() : '',
        programa: progCol ? String(row[progCol] || '').trim() : ''
      }))
      .filter(item => item.text && window.DataLoader.normalize(item.text) !== 'no especifica')
    : [];

  container.innerHTML = `
    ${pageHeader('NPS y Cualitativo', 'Recomendación de la Universidad Norbert Wiener (NPS) y razones categorizadas y abiertas de los egresados.')}
    ${renderNpsCard(nps)}
    ${npsQuestions.length ? `
      <div class="questions-grid" style="margin-bottom: 20px;">
        ${npsQuestions.map(questionCard).join('')}
      </div>
    ` : ''}
    <section class="card openq-card">
      <div class="section-heading" style="margin-top: 0;">
        <h3>${escapeHTML(openCfg?.titulo || 'Respuestas abiertas')}</h3>
        <span class="section-count" id="openq-visible-count">${formatNumber(rawItems.length)} comentarios</span>
      </div>
      <div class="nps-filter-bar">
        <div class="nps-pills" role="group" aria-label="Filtrar por segmento NPS">
          <button type="button" class="nps-pill active" data-seg="Todos">Todos (${formatNumber(rawItems.length)})</button>
          <button type="button" class="nps-pill" data-seg="Promotor">Promotores</button>
          <button type="button" class="nps-pill" data-seg="Neutral (pasivo)">Pasivos</button>
          <button type="button" class="nps-pill" data-seg="Detractor">Detractores</button>
        </div>
        <div class="search-box" style="max-width: 320px;">
          <i class="fas fa-magnifying-glass"></i>
          <input type="search" id="openq-search" placeholder="Buscar palabra clave o categoría…" autocomplete="off">
        </div>
      </div>
      <ul class="openq-list" id="openq-list"></ul>
      <p class="openq-more" id="openq-more"></p>
    </section>
  `;

  if (npsQuestions.length) initQuestionCards(container);

  const listEl = container.querySelector('#openq-list');
  const countEl = container.querySelector('#openq-visible-count');
  const moreEl = container.querySelector('#openq-more');
  const searchEl = container.querySelector('#openq-search');
  const pills = container.querySelectorAll('.nps-pill');

  let activeSeg = 'Todos';
  let searchQuery = '';

  const renderList = () => {
    const qNorm = window.DataLoader.normalize(searchQuery);
    const filtered = rawItems.filter(item => {
      if (activeSeg !== 'Todos' && item.segment !== activeSeg) return false;
      if (qNorm) {
        const hay = window.DataLoader.normalize(`${item.text} ${item.category} ${item.programa}`);
        if (!hay.includes(qNorm)) return false;
      }
      return true;
    });

    if (countEl) countEl.textContent = `${formatNumber(filtered.length)} comentarios`;

    if (!filtered.length) {
      listEl.innerHTML = '<li style="color:#666;">No hay comentarios que coincidan con el filtro seleccionado.</li>';
      if (moreEl) moreEl.textContent = '';
      return;
    }

    const shown = filtered.slice(0, 120);
    listEl.innerHTML = shown.map(item => {
      const segNorm = window.DataLoader.normalize(item.segment);
      const tagCls = segNorm.includes('detractor') ? 'detractor' : (segNorm.includes('neutral') ? 'neutral' : '');
      return `
        <li>
          <div class="openq-item-header">
            <span>
              ${item.segment ? `<span class="openq-tag ${tagCls}">${escapeHTML(item.segment)}</span>` : ''}
              ${item.category ? ` <strong>${escapeHTML(item.category)}</strong>` : ''}
            </span>
            <span>${escapeHTML([item.tipo, item.programa].filter(Boolean).join(' · '))}</span>
          </div>
          <div>${escapeHTML(item.text)}</div>
        </li>
      `;
    }).join('');

    if (moreEl) {
      moreEl.textContent = filtered.length > 120
        ? `Mostrando los primeros 120 de ${formatNumber(filtered.length)} comentarios.`
        : '';
    }
  };

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeSeg = pill.dataset.seg;
      renderList();
    });
  });

  searchEl?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderList();
  });

  renderList();
}
