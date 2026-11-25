/*
 * pageUtils.js — Utilidades compartidas por las páginas del dashboard de Posgrado.
 */

export const COLORS = (window.POSGRADO_CONFIG && window.POSGRADO_CONFIG.chartColors) || [
  '#000000', '#DCB17C', '#4B5563', '#9CA3AF', '#D1D5DB', '#27272A', '#B88B52', '#E5E7EB'
];

const UNDEFINED_LABELS = new Set([
  'no especifica', 'sin dato', 'no precisa', 'prefiero no indicarlo', 'no aplica',
  'sin clasificar / no indica', 'sin clasificar'
]);

/** Limpia etiquetas de respuesta eliminando espacios extras y puntos finales erráticos. */
export function cleanDisplayLabel(label) {
  return String(label == null ? '' : label)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '')
    .trim();
}

function normalizeClean(value) {
  return window.DataLoader.normalize(cleanDisplayLabel(value));
}

export function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-PE');
}

export function formatPercent(value, total, decimals = 0) {
  if (!total || value <= 0) return '0%';
  const pct = (value / total) * 100;
  if (decimals === 0 && pct > 0 && pct < 0.5) return '<1%';
  return decimals > 0 ? `${pct.toFixed(decimals)}%` : `${Math.round(pct)}%`;
}

export function pageHeader(title, subtitle) {
  return `
    <header class="page-header">
      <h2 class="page-title">${escapeHTML(title)}</h2>
      ${subtitle ? `<p class="page-subtitle">${escapeHTML(subtitle)}</p>` : ''}
    </header>
  `;
}

export function kpiCard(label, value, detail = '', icon = 'fas fa-chart-simple', extraClass = '') {
  return `
    <article class="kpi-card ${extraClass}">
      <div class="kpi-icon"><i class="${icon}"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">${escapeHTML(label)}</span>
        <span class="kpi-value">${escapeHTML(value)}</span>
        ${detail ? `<span class="kpi-detail">${escapeHTML(detail)}</span>` : ''}
      </div>
    </article>
  `;
}

export function emptyState(message, icon = 'fas fa-inbox') {
  return `
    <div class="empty-state" style="padding: 60px 20px; text-align: center;">
      <i class="${icon}" style="font-size: 44px; color: #c9c9c9; margin-bottom: 14px; display:block;"></i>
      <h3 style="color:#111; font-size:18px; margin-bottom:6px;">Sin datos para mostrar</h3>
      <p style="color:#666; max-width:560px; margin:0 auto;">${escapeHTML(message)}</p>
    </div>
  `;
}

export function resolveQuestionColumn(question) {
  const aliases = Array.isArray(question.column) ? question.column : [question.column];
  return window.DataLoader.resolveColumn(aliases);
}

function splitMulti(value) {
  return String(value)
    .split(/;|\||,|\n/)
    .map(v => v.trim())
    .filter(Boolean);
}

function resolveIndicatorColumns(question) {
  if (!Array.isArray(question.indicatorColumns) || !question.indicatorColumns.length) return [];
  return question.indicatorColumns
    .map(name => ({ label: cleanDisplayLabel(name), col: window.DataLoader.resolveColumn([name]) }))
    .filter(item => item.col);
}

function extractRowValues(row, question, column, indicatorCols) {
  if (indicatorCols && indicatorCols.length) {
    const selected = [];
    indicatorCols.forEach(ind => {
      const v = window.DataLoader.normalize(row[ind.col]);
      if (v === 'si') selected.push(ind.label);
    });
    if (selected.length) return selected;
    const raw = column ? row[column] : '';
    if (raw !== '' && raw != null) {
      const cleanedRaw = cleanDisplayLabel(raw);
      if (UNDEFINED_LABELS.has(window.DataLoader.normalize(cleanedRaw))) {
        return [cleanedRaw];
      }
    }
    return [];
  }
  const raw = column ? row[column] : '';
  if (raw === '' || raw == null) return [];
  return (question.tipo === 'multi' ? splitMulti(raw) : [String(raw)]).map(cleanDisplayLabel).filter(Boolean);
}

/** Devuelve el conteo de respuestas válidas de una pregunta (separando no especifica / prefiero no indicarlo). */
export function getDistribution(rows, question) {
  const column = resolveQuestionColumn(question);
  const indicatorCols = resolveIndicatorColumns(question);
  if (!column && !indicatorCols.length) {
    return { column: null, entries: [], total: 0, mentions: 0, excludedTotal: 0, excludedDetails: [] };
  }

  if (question.tipo === 'numeric_avg') {
    const tipoCol = window.DataLoader.getFilterColumn('tipoPrograma');
    const sums = new Map();
    let validCount = 0;
    let sumAll = 0;
    rows.forEach(row => {
      const num = Number(String(row[column] || '').replace(/[^\d.]/g, ''));
      if (num > 0) {
        validCount += 1;
        sumAll += num;
        const grp = (tipoCol && String(row[tipoCol] || '').trim()) || 'General';
        const cur = sums.get(grp) || { sum: 0, n: 0 };
        cur.sum += num;
        cur.n += 1;
        sums.set(grp, cur);
      }
    });
    const entries = [...sums.entries()]
      .map(([label, o]) => ({ label, count: Math.round(o.sum / o.n), sampleN: o.n }))
      .sort((a, b) => b.count - a.count);
    const avgAll = validCount > 0 ? Math.round(sumAll / validCount) : 0;
    return {
      column,
      entries,
      total: validCount,
      mentions: validCount,
      average: avgAll,
      excludedTotal: 0,
      excludedDetails: []
    };
  }

  const excludes = new Set((question.excluir || []).map(v => normalizeClean(v)));
  const order = (question.orden || []).map(v => normalizeClean(v));
  const keepUndefined = Boolean(question.incluirNoEspecifica);
  const counts = new Map();
  const excludedCounts = new Map();
  let respondents = 0;
  let excludedRespondents = 0;

  rows.forEach(row => {
    const cleaned = extractRowValues(row, question, column, indicatorCols);
    if (!cleaned.length) return;

    const validValues = [];
    let rowHasUndefined = false;
    cleaned.forEach(v => {
      const norm = window.DataLoader.normalize(v);
      if (!norm || excludes.has(norm)) return;
      if (!keepUndefined && UNDEFINED_LABELS.has(norm)) {
        rowHasUndefined = true;
        excludedCounts.set(v, (excludedCounts.get(v) || 0) + 1);
        return;
      }
      validValues.push(v);
    });

    if (validValues.length) {
      respondents += 1;
      validValues.forEach(value => {
        counts.set(value, (counts.get(value) || 0) + 1);
      });
    } else if (rowHasUndefined) {
      excludedRespondents += 1;
    }
  });

  let entries = [...counts.entries()].map(([label, count]) => ({ label, count }));

  if (order.length) {
    entries.sort((a, b) => {
      const ia = order.indexOf(window.DataLoader.normalize(a.label));
      const ib = order.indexOf(window.DataLoader.normalize(b.label));
      if (ia !== ib) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return b.count - a.count;
    });
  } else {
    entries.sort((a, b) => {
      const ua = UNDEFINED_LABELS.has(window.DataLoader.normalize(a.label)) ? 1 : 0;
      const ub = UNDEFINED_LABELS.has(window.DataLoader.normalize(b.label)) ? 1 : 0;
      if (ua !== ub) return ua - ub;
      return b.count - a.count || a.label.localeCompare(b.label, 'es');
    });
  }

  const mentions = entries.reduce((acc, e) => acc + e.count, 0);
  const total = question.tipo === 'multi' ? respondents : mentions;
  const excludedDetails = [...excludedCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const excludedTotal = question.tipo === 'multi'
    ? excludedRespondents
    : excludedDetails.reduce((acc, e) => acc + e.count, 0);

  return { column, entries, total, mentions, excludedTotal, excludedDetails };
}

/** Agrupa categorías excedentes para que el gráfico siga siendo legible. */
export function limitCategories(entries, max = 8, collapseRest = true) {
  if (entries.length <= max) return entries;
  if (!collapseRest) return entries.slice(0, max);
  const head = entries.slice(0, max - 1);
  const rest = entries.slice(max - 1);
  return [...head, { label: 'Otros', count: rest.reduce((a, e) => a + e.count, 0) }];
}

function getSliceColors(labels, question = {}, mode = 'categorical') {
  if (mode === 'singleBar') {
    return labels.map(label => {
      const norm = window.DataLoader.normalize(label);
      if (norm === 'otros' || UNDEFINED_LABELS.has(norm)) return '#9CA3AF';
      return '#000000';
    });
  }

  if (labels.length === 2) {
    const norms = labels.map(l => window.DataLoader.normalize(l));
    const idxNo = norms.findIndex(n => n === 'no' || n.startsWith('no ') || n === 'no aplica');
    if (idxNo === 0) return ['#D1D5DB', '#000000'];
    return ['#000000', '#D1D5DB'];
  }

  if (labels.length === 3) {
    return labels.map((label, i) => {
      const norm = window.DataLoader.normalize(label);
      if (norm === 'otros' || UNDEFINED_LABELS.has(norm)) return '#D1D5DB';
      return ['#000000', '#DCB17C', '#D1D5DB'][i];
    });
  }

  if (question.orden && question.orden.length) {
    const firstNorm = window.DataLoader.normalize(labels[0] || '');
    const startsWithNo = firstNorm === 'no' || firstNorm.startsWith('no ');
    const scale = startsWithNo
      ? ['#D1D5DB', '#DCB17C', '#4B5563', '#000000', '#9CA3AF']
      : ['#000000', '#4B5563', '#DCB17C', '#9CA3AF', '#D1D5DB', '#E5E7EB'];
    return labels.map((label, i) => {
      const norm = window.DataLoader.normalize(label);
      if (norm === 'otros' || UNDEFINED_LABELS.has(norm)) return '#D1D5DB';
      const idx = Math.min(scale.length - 1, Math.round((i / Math.max(1, labels.length - 1)) * Math.min(scale.length - 1, labels.length - 1)));
      return scale[idx];
    });
  }

  const basePalette = ['#000000', '#DCB17C', '#4B5563', '#D1D5DB', '#9CA3AF', '#B88B52'];
  return labels.map((label, i) => {
    const norm = window.DataLoader.normalize(label);
    if (norm === 'otros' || UNDEFINED_LABELS.has(norm)) return '#D1D5DB';
    return basePalette[i % basePalette.length];
  });
}

function updateQuestionNote(canvasId, dist, extraNote = '') {
  const noteEl = document.getElementById(`${canvasId}-note`);
  if (!noteEl) return;
  const parts = [];
  if (dist && dist.excludedTotal) {
    const detailText = dist.excludedDetails
      .slice(0, 3)
      .map(d => `${formatNumber(d.count)} "${d.label}"`)
      .join(', ');
    parts.push(`Base válida: ${formatNumber(dist.total)} respuestas. Se excluyen ${formatNumber(dist.excludedTotal)} registros sin dato útil (${detailText}).`);
  }
  if (extraNote) parts.push(extraNote);
  if (!parts.length) {
    noteEl.hidden = true;
    noteEl.textContent = '';
    return;
  }
  noteEl.textContent = parts.join(' ');
  noteEl.hidden = false;
}

export function renderGeneralChart(canvasId, question, rows) {
  const dist = getDistribution(rows, question);
  const inner = document.getElementById(canvasId)?.parentElement;
  const wrap = inner?.classList.contains('question-chart-inner') ? inner.parentElement : inner;
  updateQuestionNote(
    canvasId,
    dist,
    question.tipo === 'numeric_avg' && dist.average
      ? `Promedio general ponderado: S/ ${formatNumber(dist.average)} (n = ${formatNumber(dist.total)} con sueldo declarado).`
      : ''
  );

  if (!dist.entries.length) {
    if (wrap) {
      wrap.classList.remove('is-donut-square');
      wrap.style.height = '260px';
    }
    if (inner) inner.style.height = '100%';
    if (window.Charts) window.Charts.showEmpty(canvasId, 'Sin respuestas válidas para esta pregunta con los filtros actuales.');
    return dist;
  }

  if (question.tipo === 'numeric_avg') {
    const labels = dist.entries.map(e => e.label);
    const values = dist.entries.map(e => e.count);
    const sampleNs = dist.entries.map(e => e.sampleN || 0);
    if (wrap) {
      wrap.classList.remove('is-donut-square');
      wrap.style.height = '330px';
    }
    if (inner) inner.style.height = '100%';
    window.Charts.createBarChart(canvasId, labels, [{
      label: 'Sueldo promedio (S/)',
      data: values,
      sampleNs,
      backgroundColor: '#000000',
      borderColor: '#000000'
    }], {
      yAxisFormat: v => `S/ ${formatNumber(v)}`,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          formatter: val => `S/ ${formatNumber(Math.round(val))}`
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y;
              const n = ctx.dataset.sampleNs ? ctx.dataset.sampleNs[ctx.dataIndex] : 0;
              return `${ctx.label}: S/ ${formatNumber(val)} (n = ${formatNumber(n)})`;
            }
          }
        }
      }
    });
    return dist;
  }

  const useTopN = Boolean(question.topN);
  const entries = useTopN
    ? limitCategories(dist.entries, question.topN, false)
    : limitCategories(dist.entries, 12, true);

  const labels = entries.map(e => e.label);
  const values = entries.map(e => e.count);
  const chartType = question.chart || (entries.length <= 6 ? 'doughnut' : 'horizontal_bar');
  const palette = getSliceColors(labels, question, chartType === 'doughnut' ? 'categorical' : 'singleBar');

  const hasLongLabels = labels.some(l => String(l || '').length > 28);
  const perBarPx = hasLongLabels ? 46 : 36;
  const targetHeight = Math.max(320, entries.length * perBarPx + 36);

  if (wrap) {
    wrap.classList.toggle('is-donut-square', chartType === 'doughnut');
    if (chartType === 'horizontal_bar') {
      wrap.style.height = `${Math.min(targetHeight, 500)}px`;
    } else if (chartType === 'doughnut' && entries.length > 5) {
      wrap.style.height = '350px';
    } else if (chartType === 'bar' && labels.some(l => String(l || '').length > 18)) {
      wrap.style.height = '350px';
    } else {
      wrap.style.height = '330px';
    }
  }
  if (inner) {
    inner.style.height = chartType === 'horizontal_bar'
      ? `${targetHeight}px`
      : '100%';
  }

  if (chartType === 'doughnut') {
    window.Charts.createDoughnutChart(canvasId, labels, values, {
      colors: palette,
      legendPosition: entries.length <= 5 ? 'right' : 'bottom',
      plugins: {
        datalabels: {
          display: true,
          percentOfTotal: dist.total
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const value = ctx.parsed;
              const pct = formatPercent(value, dist.total);
              return `${ctx.label}: ${formatNumber(value)} (${pct})`;
            }
          }
        }
      }
    });
  } else if (chartType === 'bar') {
    window.Charts.createBarChart(canvasId, labels, [{
      label: 'Respuestas',
      data: values,
      backgroundColor: palette,
      borderColor: palette
    }], {
      plugins: {
        legend: { display: false },
        datalabels: { display: true, percentOfTotal: dist.total },
        tooltip: {
          callbacks: {
            label: ctx => {
              const value = ctx.parsed.y;
              return `${ctx.label}: ${formatNumber(value)} (${formatPercent(value, dist.total)})`;
            }
          }
        }
      }
    });
  } else {
    window.Charts.createHorizontalBarChart(canvasId, labels, [{
      label: 'Respuestas',
      data: values,
      backgroundColor: palette,
      borderColor: palette
    }], {
      plugins: {
        legend: { display: false },
        datalabels: { display: true, percentOfTotal: dist.total },
        tooltip: {
          callbacks: {
            label: ctx => {
              const value = ctx.parsed.x;
              return `${ctx.label}: ${formatNumber(value)} (${formatPercent(value, dist.total)})`;
            }
          }
        }
      }
    });
  }

  return dist;
}

/** Matriz de cruce: categorías de respuesta × valores del campo de cruce. */
export function getCrossMatrix(rows, question, crossFilterId, maxCategories = 7) {
  const column = resolveQuestionColumn(question);
  const indicatorCols = resolveIndicatorColumns(question);
  const crossColumn = window.DataLoader.getFilterColumn(crossFilterId);
  if ((!column && !indicatorCols.length) || !crossColumn) return null;

  if (question.tipo === 'numeric_avg') {
    const rawOptions = window.DataLoader.getOptions(crossFilterId);
    const sumsByCross = new Map();
    rows.forEach(row => {
      const cv = String(row[crossColumn] || '').trim();
      if (!cv) return;
      const num = Number(String(row[column] || '').replace(/[^\d.]/g, ''));
      if (num > 0) {
        const cur = sumsByCross.get(cv) || { sum: 0, n: 0 };
        cur.sum += num;
        cur.n += 1;
        sumsByCross.set(cv, cur);
      }
    });
    let crossValues = rawOptions.filter(v => (sumsByCross.get(v)?.n || 0) > 0);
    if (crossFilterId === 'programa' || crossFilterId === 'tipoPrograma') {
      crossValues.sort((a, b) => {
        const avgA = sumsByCross.get(a).sum / sumsByCross.get(a).n;
        const avgB = sumsByCross.get(b).sum / sumsByCross.get(b).n;
        return avgB - avgA;
      });
    }
    if (!crossValues.length) return null;
    const dist = getDistribution(rows, question);
    return {
      isNumericAvg: true,
      categories: ['Sueldo promedio (S/)'],
      crossValues,
      averages: crossValues.map(v => Math.round(sumsByCross.get(v).sum / sumsByCross.get(v).n)),
      counts: crossValues.map(v => sumsByCross.get(v).n),
      totals: new Map(crossValues.map(v => [v, sumsByCross.get(v).n])),
      dist
    };
  }

  const excludes = new Set((question.excluir || []).map(v => normalizeClean(v)));
  const keepUndefined = Boolean(question.incluirNoEspecifica);
  const dist = getDistribution(rows, question);
  const entries = limitCategories(dist.entries, maxCategories, !question.topN);
  const categories = entries.map(e => e.label);

  // Ordenar valores del eje de cruce: por año ascendente/descendente o por volumen descendente para programas
  const rawOptions = window.DataLoader.getOptions(crossFilterId);
  const countsByCross = new Map();
  rows.forEach(row => {
    const cv = String(row[crossColumn] || '').trim();
    if (!cv) return;
    const vals = extractRowValues(row, question, column, indicatorCols);
    if (!vals.length) return;
    const valid = vals.filter(v => {
      const norm = window.DataLoader.normalize(v);
      return norm !== '' && !excludes.has(norm) && (keepUndefined || !UNDEFINED_LABELS.has(norm));
    });
    if (!valid.length) return;
    countsByCross.set(cv, (countsByCross.get(cv) || 0) + 1);
  });

  let crossValues = rawOptions.filter(v => (countsByCross.get(v) || 0) > 0);
  if (crossFilterId === 'programa' || crossFilterId === 'tipoPrograma') {
    crossValues.sort((a, b) => (countsByCross.get(b) || 0) - (countsByCross.get(a) || 0));
  }

  if (!crossValues.length || !categories.length) return null;

  const matrix = new Map();
  categories.forEach(cat => matrix.set(cat, new Map(crossValues.map(v => [v, 0]))));
  const totals = new Map(crossValues.map(v => [v, 0]));
  const mentionTotals = new Map(crossValues.map(v => [v, 0]));

  rows.forEach(row => {
    const crossValue = String(row[crossColumn] || '').trim();
    if (!totals.has(crossValue)) return;
    const values = extractRowValues(row, question, column, indicatorCols);
    if (!values.length) return;
    const validValues = values.filter(v => {
      const norm = window.DataLoader.normalize(v);
      return norm !== '' && !excludes.has(norm) && (keepUndefined || !UNDEFINED_LABELS.has(norm));
    });
    if (!validValues.length) return;

    let counted = false;
    validValues.forEach(value => {
      const cat = categories.includes(value) ? value : (question.topN ? null : 'Otros');
      if (!cat || !categories.includes(cat)) return;
      const rowMap = matrix.get(cat);
      rowMap.set(crossValue, rowMap.get(crossValue) + 1);
      mentionTotals.set(crossValue, mentionTotals.get(crossValue) + 1);
      counted = true;
    });
    if (counted) totals.set(crossValue, totals.get(crossValue) + 1);
  });

  return { categories, crossValues, matrix, totals, mentionTotals, dist };
}

export function renderCrossChart(canvasId, question, rows, crossFilterId) {
  const cross = getCrossMatrix(rows, question, crossFilterId);
  const inner = document.getElementById(canvasId)?.parentElement;
  const wrap = inner?.classList.contains('question-chart-inner') ? inner.parentElement : inner;
  if (wrap) wrap.classList.remove('is-donut-square');

  if (!cross) {
    updateQuestionNote(canvasId, null);
    if (inner) inner.style.height = '100%';
    if (window.Charts) window.Charts.showEmpty(canvasId, 'No hay suficientes datos válidos para este cruce.');
    return null;
  }

  if (cross.isNumericAvg) {
    const isMany = cross.crossValues.length > 5;
    if (wrap) wrap.style.height = isMany ? '380px' : '330px';
    if (inner) {
      inner.style.height = isMany
        ? `${Math.max(340, cross.crossValues.length * 28 + 48)}px`
        : '100%';
    }
    updateQuestionNote(
      canvasId,
      cross.dist,
      `Promedio general: S/ ${formatNumber(cross.dist.average)} (n = ${formatNumber(cross.dist.total)}).`
    );
    const ds = [{
      label: 'Sueldo promedio (S/)',
      data: cross.averages,
      sampleNs: cross.counts,
      backgroundColor: '#000000',
      borderColor: '#000000'
    }];
    const opts = {
      xAxisFormat: v => `S/ ${formatNumber(v)}`,
      yAxisFormat: v => `S/ ${formatNumber(v)}`,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          formatter: val => `S/ ${formatNumber(Math.round(val))}`
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = isMany ? ctx.parsed.x : ctx.parsed.y;
              const n = ctx.dataset.sampleNs ? ctx.dataset.sampleNs[ctx.dataIndex] : 0;
              return `${ctx.label}: S/ ${formatNumber(val)} (n = ${formatNumber(n)})`;
            }
          }
        }
      }
    };
    if (isMany) {
      window.Charts.createHorizontalBarChart(canvasId, cross.crossValues, ds, opts);
    } else {
      window.Charts.createBarChart(canvasId, cross.crossValues, ds, opts);
    }
    return cross;
  }

  const isMulti = question.tipo === 'multi';
  updateQuestionNote(
    canvasId,
    cross.dist,
    isMulti ? 'Cruce apilado expresado como % sobre el total de menciones en cada segmento (selección múltiple).' : ''
  );
  const { categories, crossValues, matrix, totals, mentionTotals } = cross;
  const denomMap = isMulti ? mentionTotals : totals;
  const isManyValues = crossValues.length > 8;

  if (wrap) {
    wrap.style.height = isManyValues ? '420px' : '350px';
  }
  if (inner) {
    inner.style.height = isManyValues
      ? `${Math.max(360, crossValues.length * 36 + 56)}px`
      : '100%';
  }

  const palette = getSliceColors(categories, question, 'categorical');
  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: crossValues.map(value => {
      const denom = denomMap.get(value) || 0;
      if (!denom) return 0;
      return Math.round(((matrix.get(cat).get(value) || 0) / denom) * 100);
    }),
    rawCounts: crossValues.map(value => matrix.get(cat).get(value) || 0),
    backgroundColor: palette[i]
  }));

  const showLabels = crossValues.length <= 16;
  const options = {
    colors: palette,
    maxRotation: 35,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
      datalabels: {
        display: showLabels,
        formatter: val => (Number(val) >= 4 ? `${Math.round(val)}%` : '')
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const pct = ctx.chart.options.indexAxis === 'y' ? ctx.parsed.x : ctx.parsed.y;
            const raw = ctx.dataset.rawCounts ? ctx.dataset.rawCounts[ctx.dataIndex] : null;
            const crossVal = ctx.label;
            const baseN = totals.get(crossVal) || 0;
            const denom = denomMap.get(crossVal) || 0;
            if (raw == null) return `${ctx.dataset.label}: ${pct}%`;
            return isMulti
              ? `${ctx.dataset.label}: ${pct}% de menciones (${formatNumber(raw)}/${formatNumber(denom)} menciones · n=${formatNumber(baseN)})`
              : `${ctx.dataset.label}: ${pct}% (${formatNumber(raw)}/${formatNumber(baseN)})`;
          }
        }
      }
    }
  };

  if (isManyValues) {
    window.Charts.createHorizontalStackedBarChart(canvasId, crossValues, datasets, options);
  } else {
    window.Charts.createStackedBarChart(canvasId, crossValues, datasets, options);
  }

  return cross;
}

function crossLabel(crossFilterId) {
  const cfg = window.POSGRADO_CONFIG;
  const filter = (cfg.filters || []).find(f => f.id === crossFilterId);
  return filter ? filter.label : crossFilterId;
}

/** HTML de una tarjeta de pregunta con pestañas General + cruces. */
export function questionCard(question) {
  const rows = window.App.getFilteredData();
  const dist = getDistribution(rows, question);
  const canvasId = `rg-chart-${question.id}`;
  const crossFields = (window.POSGRADO_CONFIG.crossFields || [])
    .filter(id => window.DataLoader.getFilterColumn(id));

  const tabs = [
    `<button type="button" class="rg-tab active" role="tab" aria-selected="true" data-cross="general">General</button>`,
    ...crossFields.map(id =>
      `<button type="button" class="rg-tab" role="tab" aria-selected="false" data-cross="${id}">${escapeHTML(crossLabel(id))}</button>`
    )
  ].join('');

  const metaHints = [];
  if (question.tipo === 'multi') metaHints.push('Selección múltiple (% sobre encuestados)');
  if (question.topN && dist.entries.length > question.topN) {
    metaHints.push(`Mostrando Top ${question.topN} de ${formatNumber(dist.entries.length)} categorías`);
  }

  return `
    <section class="card question-card ${question.fullWidth ? 'full-width' : ''}" data-question-id="${question.id}" id="rg-q-${question.id}">
      <header class="question-card-header">
        <div class="question-icon"><i class="${question.icono || 'fas fa-circle-question'}"></i></div>
        <div class="question-heading">
          <span class="question-family">${escapeHTML(question.familia || 'Resultados generales')}</span>
          <h3>${escapeHTML(question.titulo)}</h3>
        </div>
        <span class="question-n" title="Respuestas válidas">n = ${formatNumber(dist.total)}</span>
      </header>
      <div class="rg-tabs" role="tablist">${tabs}</div>
      ${metaHints.length ? `<div class="question-meta-row"><span>${escapeHTML(metaHints.join(' · '))}</span></div>` : ''}
      <div class="question-chart-wrap" style="overflow-y:auto;">
        <div class="question-chart-inner">
          <canvas id="${canvasId}"></canvas>
        </div>
      </div>
      <p class="rg-note" id="${canvasId}-note" hidden></p>
    </section>
  `;
}

export function initQuestionCards(container) {
  container.querySelectorAll('.question-card').forEach(card => {
    const questionId = card.dataset.questionId;
    const question = (window.POSGRADO_CONFIG.questions || []).find(q => q.id === questionId);
    if (!question) return;
    const canvasId = `rg-chart-${question.id}`;
    const tabs = card.querySelectorAll('.rg-tab');

    const draw = crossId => {
      const rows = window.App.getFilteredData();
      if (crossId === 'general') {
        renderGeneralChart(canvasId, question, rows);
      } else {
        renderCrossChart(canvasId, question, rows, crossId);
      }
      if (window.Charts?.attachFullscreenButtons) {
        window.Charts.attachFullscreenButtons();
      }
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        draw(tab.dataset.cross);
      });
    });

    draw('general');
  });
}

export function computeNPS(rows) {
  const cfg = window.POSGRADO_CONFIG.nps || {};
  const column = window.DataLoader.resolveColumn(cfg.column || []);
  if (!column) return null;

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  rows.forEach(row => {
    const raw = String(row[column] || '').trim();
    if (!/^\d+$/.test(raw)) return;
    const score = parseInt(raw, 10);
    if (score < 0 || score > 10) return;
    if (score >= 9) promoters += 1;
    else if (score >= 7) passives += 1;
    else detractors += 1;
  });

  const total = promoters + passives + detractors;
  if (!total) return null;
  const nps = Math.round(((promoters - detractors) / total) * 100);
  return { column, promoters, passives, detractors, total, nps };
}

export function computeAverageSalary(rows) {
  const col = window.DataLoader.resolveColumn(['Sueldo Promedio']);
  if (!col) return null;
  let sum = 0;
  let count = 0;
  rows.forEach(row => {
    const num = Number(String(row[col] || '').replace(/[^\d.]/g, ''));
    if (num > 0) {
      sum += num;
      count += 1;
    }
  });
  if (!count) return null;
  return { average: Math.round(sum / count), count };
}
