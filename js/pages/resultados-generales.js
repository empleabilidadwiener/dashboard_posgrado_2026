// js/pages/resultados-generales.js — Un gráfico por pregunta + cruces por año, tipo de programa y programa.
import {
  pageHeader,
  questionCard,
  initQuestionCards,
  emptyState,
  escapeHTML,
  formatNumber
} from './pageUtils.js';

export async function loadResultadosGeneralesPage(container, data) {
  const cfg = window.POSGRADO_CONFIG;
  const questions = cfg.questions || [];

  if (!questions.length) {
    container.innerHTML = pageHeader(
      'Resultados Generales',
      'Un gráfico por cada pregunta del instrumento, con cruces por año de egreso, tipo de programa y programa específico.'
    ) + emptyState(
      'Aún no hay preguntas configuradas en js/config.js.',
      'fas fa-sliders'
    );
    return;
  }

  // Agrupar manteniendo el orden lógico del instrumento
  const families = [];
  questions.forEach(q => {
    const fam = q.familia || 'General';
    let group = families.find(f => f.name === fam);
    if (!group) {
      group = { name: fam, id: `fam-${families.length + 1}`, questions: [] };
      families.push(group);
    }
    group.questions.push(q);
  });

  const sections = families.map(family => `
    <section class="rg-family" id="${family.id}">
      <div class="section-heading">
        <h3>${escapeHTML(family.name)}</h3>
        <span class="section-count">${family.questions.length} pregunta${family.questions.length === 1 ? '' : 's'}</span>
      </div>
      <div class="questions-grid">${family.questions.map(questionCard).join('')}</div>
    </section>
  `).join('');

  container.innerHTML = `
    ${pageHeader(
      'Resultados Generales',
      'Un gráfico por cada pregunta resaltada del instrumento. Cada tarjeta permite alternar entre el resultado general y los cruces por año de egreso, tipo de programa (columna F) y programa específico.'
    )}
    <div class="rg-meta">
      <span><i class="fas fa-database"></i> ${formatNumber(data.length)} respuestas con los filtros actuales</span>
      <span><i class="fas fa-list-check"></i> ${questions.length} preguntas del instrumento</span>
    </div>
    ${sections}
  `;

  initQuestionCards(container);
}
