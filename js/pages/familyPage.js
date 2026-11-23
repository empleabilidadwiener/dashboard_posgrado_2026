// js/pages/familyPage.js — Render genérico para pestañas temáticas.
import {
  pageHeader,
  questionCard,
  initQuestionCards,
  emptyState,
  escapeHTML,
  formatNumber
} from './pageUtils.js';

function normalize(value) {
  return window.DataLoader.normalize(value);
}

export function selectQuestionsForPage(pageId, familyMatchers) {
  const questions = window.POSGRADO_CONFIG.questions || [];
  const matchers = familyMatchers.map(normalize);
  return questions.filter(question => {
    if (question.pagina) return question.pagina === pageId;
    const family = normalize(question.familia || '');
    return matchers.some(m => family.includes(m));
  });
}

export function renderFamilyPage(container, { pageId, title, subtitle, familyMatchers, kpisHtml = '' }) {
  const questions = selectQuestionsForPage(pageId, familyMatchers);

  if (!questions.length) {
    container.innerHTML = pageHeader(title, subtitle) + emptyState(
      'Esta pestaña se completará cuando el instrumento esté mapeado en js/config.js.',
      'fas fa-layer-group'
    );
    return;
  }

  const families = [];
  questions.forEach(question => {
    const family = question.familia || title;
    let group = families.find(f => f.name === family);
    if (!group) {
      group = { name: family, questions: [] };
      families.push(group);
    }
    group.questions.push(question);
  });

  const rows = window.App.getFilteredData();
  const sections = families.map(family => `
    <section class="rg-family">
      <div class="section-heading">
        <h3>${escapeHTML(family.name)}</h3>
        <span class="section-count">${family.questions.length} pregunta${family.questions.length === 1 ? '' : 's'}</span>
      </div>
      <div class="questions-grid">
        ${family.questions.map(questionCard).join('')}
      </div>
    </section>
  `).join('');

  container.innerHTML = `
    ${pageHeader(title, subtitle)}
    ${kpisHtml ? `<div class="kpi-grid" style="margin-top: 16px;">${kpisHtml}</div>` : ''}
    <div class="rg-meta">
      <span><i class="fas fa-database"></i> ${formatNumber(rows.length)} respuestas con los filtros actuales</span>
    </div>
    ${sections}
  `;

  initQuestionCards(container);
}
