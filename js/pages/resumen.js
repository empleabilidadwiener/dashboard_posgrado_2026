// js/pages/resumen.js — Resumen ejecutivo del estudio de empleabilidad de Posgrado 2026.
import {
  pageHeader,
  kpiCard,
  questionCard,
  initQuestionCards,
  computeNPS,
  computeAverageSalary,
  emptyState,
  escapeHTML,
  formatNumber,
  formatPercent
} from './pageUtils.js';

const SKIP_KPI_VALUES = new Set(['no especifica', 'sin dato', 'prefiero no indicarlo', 'no precisa']);

function countWhere(rows, aliases, predicate) {
  const col = window.DataLoader.resolveColumn(aliases);
  if (!col) return { match: 0, total: 0 };
  let match = 0;
  let total = 0;
  rows.forEach(row => {
    const val = String(row[col] || '').trim();
    if (!val) return;
    const norm = window.DataLoader.normalize(val);
    if (SKIP_KPI_VALUES.has(norm)) return;
    total += 1;
    if (predicate(norm)) match += 1;
  });
  return { match, total };
}

export async function loadResumenPage(container, data) {
  const cfg = window.POSGRADO_CONFIG;
  const questions = cfg.questions || [];
  const programs = window.DataLoader.getOptions('programa');
  const types = window.DataLoader.getOptions('tipoPrograma');
  const nps = computeNPS(data);
  const salary = computeAverageSalary(data);

  // KPIs clave desde columnas amarillas
  const empleabilidad = countWhere(data, ['Nivel de Empleabilidad Final'], v => v === 'si');
  const satisfFormacion = countWhere(
    data,
    ['¿Cuál es tu nivel de satisfacción con la formación recibida en el programa de posgrado?'],
    v => v === 'muy satisfecho' || v === 'satisfecho'
  );
  const contribColAliases = ['¿En qué medida consideras que el programa de posgrado contribuyó a mejorar tu perfil profesional?'];
  const contribucion = countWhere(
    data,
    contribColAliases,
    v => v.includes('significativamente') || v === 'contribuyo' || v.includes('parcialmente')
  );
  const contribSig = countWhere(data, contribColAliases, v => v.includes('significativamente'));
  const contribPleno = countWhere(data, contribColAliases, v => v === 'contribuyo');
  const contribParcial = countWhere(data, contribColAliases, v => v.includes('parcialmente'));
  const peaActiva = countWhere(data, ['PEA'], v => v === 'pea');

  const heroKpis = [
    kpiCard(
      'Empleabilidad (sobre PEA)',
      empleabilidad.total ? formatPercent(empleabilidad.match, empleabilidad.total, 1) : '—',
      `${formatNumber(empleabilidad.match)} empleados de ${formatNumber(empleabilidad.total)} PEA`,
      'fas fa-briefcase',
      'kpi-featured'
    ),
    kpiCard(
      'Ingreso mensual promedio',
      salary ? `S/ ${formatNumber(salary.average)}` : '—',
      salary ? `Base: ${formatNumber(salary.count)} con rango declarado` : 'Sin datos salariales',
      'fas fa-money-bill-wave'
    ),
    kpiCard(
      'Satisfacción con formación',
      satisfFormacion.total ? formatPercent(satisfFormacion.match, satisfFormacion.total, 1) : '—',
      `${formatNumber(satisfFormacion.match)} de ${formatNumber(satisfFormacion.total)} respuestas válidas`,
      'fas fa-thumbs-up'
    ),
    nps
      ? kpiCard(
        'NPS Posgrado',
        `${nps.nps > 0 ? '+' : ''}${nps.nps}`,
        `${formatNumber(nps.promoters)} promotores · ${formatNumber(nps.detractors)} detractores (n=${formatNumber(nps.total)})`,
        'fas fa-star'
      )
      : kpiCard('Preguntas del instrumento', formatNumber(questions.length), 'Configuradas en js/config.js', 'fas fa-clipboard-list')
  ].join('');

  const secondaryKpis = [
    kpiCard(
      'Muestra analizada',
      formatNumber(data.length),
      `${formatNumber(programs.length)} programas · ${formatNumber(types.length)} tipos`,
      'fas fa-users'
    ),
    kpiCard(
      'Población Activa (PEA)',
      peaActiva.total ? formatPercent(peaActiva.match, peaActiva.total, 1) : '—',
      `${formatNumber(peaActiva.match)} PEA · ${formatNumber(peaActiva.total - peaActiva.match)} No PEA`,
      'fas fa-user-check'
    ),
    kpiCard(
      'Contribución al perfil profesional',
      contribucion.total ? formatPercent(contribucion.match, contribucion.total, 1) : '—',
      `${formatNumber(contribucion.match)} de ${formatNumber(contribucion.total)} válidos señalan mejora profesional: ${formatNumber(contribSig.match)} significativamente, ${formatNumber(contribPleno.match)} contribuyó y ${formatNumber(contribParcial.match)} parcialmente`,
      'fas fa-rocket'
    )
  ].join('');

  const featuredIds = [
    'nivel_empleabilidad',
    'personal_cargo',
    'mejoras_laborales',
    'tiempo_mejora',
    'ingreso_mensual',
    'satisfaccion_formacion'
  ];
  const topQuestions = featuredIds
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean);

  const charts = topQuestions.length
    ? `<div class="questions-grid">${topQuestions.map(questionCard).join('')}</div>`
    : emptyState('No se encontraron preguntas configuradas para el resumen.', 'fas fa-chart-pie');

  container.innerHTML = `
    ${pageHeader(
      cfg.title,
      'Panorama general de la inserción laboral, ingresos, satisfacción y trayectoria profesional de los egresados de posgrado.'
    )}
    <div class="resumen-hero-kpis">${heroKpis}</div>
    <div class="kpi-grid">${secondaryKpis}</div>

    <section class="rg-family">
      <div class="section-heading">
        <h3>Indicadores principales con cruces</h3>
        <span class="section-count">Explora General, Año de egreso, Tipo de programa y Programa</span>
      </div>
      ${charts}
    </section>
  `;

  if (topQuestions.length) initQuestionCards(container);
}
