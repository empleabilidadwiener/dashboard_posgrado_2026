// js/pages/representatividad.js — Ficha técnica, cruce Muestra vs. Universo Oficial y sustento metodológico.
import { pageHeader, escapeHTML, formatNumber, formatPercent } from './pageUtils.js';

function calcMarginOfError(n, N) {
  if (!n || n <= 0) return '—';
  if (N != null && N > 0 && n >= N) return '±0.00%';
  const z = 1.96;
  const p = 0.5;
  const fpc = N && N > n && N > 1 ? (N - n) / (N - 1) : 1;
  const moe = z * Math.sqrt(((p * (1 - p)) / n) * fpc) * 100;
  return `±${moe.toFixed(2)}%`;
}

function distributionTable(title, column, rows, options = {}) {
  const counts = new Map();
  rows.forEach(row => {
    const value = String(row[column] || '').trim();
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  const entries = [...counts.entries()].sort((a, b) =>
    options.sortNumeric ? Number(b[0]) - Number(a[0]) : b[1] - a[1]
  );
  const total = entries.reduce((acc, [, count]) => acc + count, 0) || 1;
  if (!entries.length) return '';

  return `
    <section class="card table-card ${options.fullWidth ? 'full-width' : ''}" style="${options.fullWidth ? 'grid-column: 1 / -1;' : ''}">
      <div class="section-heading">
        <h3>${escapeHTML(title)}</h3>
        <span class="section-count">${formatNumber(total)} registros · ${formatNumber(entries.length)} categorías</span>
      </div>
      <div class="table-responsive" style="max-height: ${options.maxHeight || '360px'}; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr><th>Categoría</th><th class="num">Frecuencia</th><th class="num">%</th></tr>
          </thead>
          <tbody>
            ${entries.map(([label, count]) => `
              <tr>
                <td>${escapeHTML(label)}</td>
                <td class="num">${formatNumber(count)}</td>
                <td class="num">${formatPercent(count, total, 1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export async function loadRepresentatividadPage(container, data) {
  const cfg = window.POSGRADO_CONFIG;
  const meta = cfg.studyMeta || {};
  const totalAll = window.DataLoader.rows.length;
  const refList = meta.universoReferencia || [];
  const activeFilters = (window.App && window.App.filters) || {};
  const univFiltered = window.DataLoader.getFilteredUniverse
    ? window.DataLoader.getFilteredUniverse(activeFilters)
    : null;

  const totalUnivOficial = univFiltered ? univFiltered.total : (meta.universoTotalOficial || 25680);
  const totalUniv2325 = univFiltered ? univFiltered.total2325 : (meta.universoTotal2325 || 8606);
  const totalUnivSustento = meta.universoTotalReferencia || 8374;

  // Contar muestra por Tipo de Programa (Columna F), Año y Programa específico
  const tipoCol = window.DataLoader.getFilterColumn('tipoPrograma');
  const anioCol = window.DataLoader.getFilterColumn('anio');
  const progCol = window.DataLoader.getFilterColumn('programa');
  const countByTipoAll = new Map();
  const countByTipo2325 = new Map();
  const countByAnioMuestra = new Map();
  const countByProgMuestra = new Map();
  const countByFuente = window.DataLoader.countBy(data, ['Fuente']);

  data.forEach(row => {
    const tipo = tipoCol ? String(row[tipoCol] || '').trim() : '';
    const anio = anioCol ? String(row[anioCol] || '').trim() : '';
    const prog = progCol ? String(row[progCol] || '').trim() : '';
    if (tipo) {
      countByTipoAll.set(tipo, (countByTipoAll.get(tipo) || 0) + 1);
      if (['2023', '2024', '2025'].includes(anio)) {
        countByTipo2325.set(tipo, (countByTipo2325.get(tipo) || 0) + 1);
      }
    }
    if (anio) {
      countByAnioMuestra.set(anio, (countByAnioMuestra.get(anio) || 0) + 1);
    }
    if (prog) {
      const pNorm = window.DataLoader.normalize(prog);
      const cur = countByProgMuestra.get(pNorm) || { programa: prog, tipo, total: 0, c2325: 0, c2326: 0 };
      cur.total += 1;
      if (['2023', '2024', '2025'].includes(anio)) cur.c2325 += 1;
      if (['2023', '2024', '2025', '2026'].includes(anio)) cur.c2326 += 1;
      countByProgMuestra.set(pNorm, cur);
    }
  });

  const total2325Muestra = [...countByTipo2325.values()].reduce((a, b) => a + b, 0);
  const samplingRateOficial = totalUnivOficial ? ((data.length / totalUnivOficial) * 100).toFixed(2) : '—';
  const samplingRate2325 = totalUniv2325 ? ((total2325Muestra / totalUniv2325) * 100).toFixed(2) : '—';
  const moeOficial = calcMarginOfError(data.length, totalUnivOficial || totalUnivSustento);
  const moeSustento = calcMarginOfError(data.length, totalUnivSustento);

  // Tabla 1: Cruce por Tipo de Programa (Columna F)
  const crossTipoRowsHtml = refList.map(item => {
    const uEntry = univFiltered?.byTipo?.get(item.tipo);
    const uOficial = uEntry ? uEntry.total : item.universoOficial;
    const u2325 = uEntry ? uEntry.c2325 : item.universo2325;
    const uSustento = item.universoSustento || 0;
    const pctUnivOficial = (uOficial != null && totalUnivOficial > 0)
      ? `${((uOficial / totalUnivOficial) * 100).toFixed(2)}%`
      : '—';
    const nAll = countByTipoAll.get(item.tipo) || 0;
    const n2325 = countByTipo2325.get(item.tipo) || 0;
    const pctMuestra = data.length ? `${((nAll / data.length) * 100).toFixed(1)}%` : '0.0%';
    const baseNForRate = uOficial != null && uOficial > 0 ? uOficial : uSustento;
    const cobertura = baseNForRate > 0 ? `${((nAll / baseNForRate) * 100).toFixed(2)}%` : '—';
    const moe = calcMarginOfError(nAll, baseNForRate);

    return `
      <tr>
        <td><strong>${escapeHTML(item.label)}</strong></td>
        <td class="num">${uOficial != null ? formatNumber(uOficial) : '<span title="No incluido en padrón SIIU de grados; ver Marco Sustento">—*</span>'}</td>
        <td class="num">${pctUnivOficial}</td>
        <td class="num">${u2325 != null && u2325 > 0 ? formatNumber(u2325) : '—'}</td>
        <td class="num">${formatNumber(uSustento)}</td>
        <td class="num">${formatNumber(item.muestraPlanificada)}</td>
        <td class="num"><strong>${formatNumber(nAll)}</strong></td>
        <td class="num">${pctMuestra}</td>
        <td class="num">${formatNumber(n2325)}</td>
        <td class="num">${cobertura}</td>
        <td class="num">${moe}</td>
      </tr>
    `;
  }).join('');

  // Tabla 2: Cruce por Año de Egreso (Universo vs. Muestra)
  const allYearsSet = new Set([
    ...(univFiltered ? univFiltered.byAnio.keys() : []),
    ...countByAnioMuestra.keys()
  ]);
  const allYears = [...allYearsSet].filter(Boolean).sort((a, b) => Number(b) - Number(a));
  const crossAnioRowsHtml = allYears.map(anio => {
    const uCount = univFiltered?.byAnio?.get(anio) || 0;
    const mCount = countByAnioMuestra.get(anio) || 0;
    const pctU = totalUnivOficial > 0 ? `${((uCount / totalUnivOficial) * 100).toFixed(2)}%` : '0.00%';
    const pctM = data.length > 0 ? `${((mCount / data.length) * 100).toFixed(1)}%` : '0.0%';
    const cob = uCount > 0 ? `${((mCount / uCount) * 100).toFixed(2)}%` : '—';
    return `
      <tr>
        <td><strong>${escapeHTML(anio)}</strong></td>
        <td class="num">${formatNumber(uCount)}</td>
        <td class="num">${pctU}</td>
        <td class="num"><strong>${formatNumber(mCount)}</strong></td>
        <td class="num">${pctM}</td>
        <td class="num">${cob}</td>
      </tr>
    `;
  }).join('');

  // Consolidado por Programa Específico (94 del Universo + Diplomados en Muestra)
  const progCombinedMap = new Map();
  if (univFiltered?.byPrograma) {
    univFiltered.byPrograma.forEach((uProg, normKey) => {
      progCombinedMap.set(normKey, {
        programa: uProg.programa,
        tipo: uProg.tipo,
        uTotal: uProg.total,
        u2326: uProg.c2326,
        mTotal: 0
      });
    });
  }
  countByProgMuestra.forEach((mProg, normKey) => {
    const existing = progCombinedMap.get(normKey);
    if (existing) {
      existing.mTotal = mProg.total;
      if (!existing.tipo && mProg.tipo) existing.tipo = mProg.tipo;
    } else {
      progCombinedMap.set(normKey, {
        programa: mProg.programa,
        tipo: mProg.tipo || 'Diplomado',
        uTotal: null,
        u2326: null,
        mTotal: mProg.total
      });
    }
  });

  const progList = [...progCombinedMap.values()].sort((a, b) =>
    (b.mTotal - a.mTotal) || ((b.uTotal || 0) - (a.uTotal || 0)) || a.programa.localeCompare(b.programa, 'es')
  );
  const progsWithSample = progList.filter(p => p.mTotal > 0).length;

  const fuenteSummary = [...countByFuente.entries()]
    .map(([k, v]) => `${escapeHTML(k)}: ${formatNumber(v)}`)
    .join(' · ');

  const extraTables = [
    { title: 'Rango de edad (Muestra)', col: window.DataLoader.resolveColumn(['Rango de Edad']) },
    { title: 'Sexo (Muestra)', col: window.DataLoader.resolveColumn(['Sexo']) },
    { title: 'Fuente de levantamiento', col: window.DataLoader.resolveColumn(['Fuente']) }
  ]
    .filter(t => t.col)
    .map(t => distributionTable(t.title, t.col, data, t))
    .join('');

  container.innerHTML = `
    ${pageHeader(
      'Ficha Técnica',
      'Parámetros de levantamiento de campo, cruce Muestra vs. Universo Oficial de Posgrado (Egresados_Posgrado_2026.xlsx) y sustento metodológico.'
    )}

    <div class="ficha-summary-grid">
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-calendar-check"></i> Levantamiento de campo</span>
        <span class="ficha-box-value">28.10 – 10.11.2026</span>
        <span class="ficha-box-note">${escapeHTML(meta.campoInicio)} al ${escapeHTML(meta.campoFin)}.<br>${fuenteSummary || 'Encuesta de Egresados Posgrado e Inhouse'}</span>
      </article>
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-users"></i> Muestra vs. Universo Oficial</span>
        <span class="ficha-box-value">${formatNumber(data.length)} / ${formatNumber(totalUnivOficial)}</span>
        <span class="ficha-box-note">Cobertura global: <strong>${samplingRateOficial}%</strong> sobre padrón histórico 2005–2026 (${formatNumber(totalUnivOficial)} egresados) · <strong>${samplingRate2325}%</strong> en cohortes 2023–2025 (${formatNumber(total2325Muestra)} de ${formatNumber(totalUniv2325)}).</span>
      </article>
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-bullseye"></i> Precisión global (95% conf.)</span>
        <span class="ficha-box-value">${moeOficial}</span>
        <span class="ficha-box-note">Margen teórico sobre universo oficial N = ${formatNumber(totalUnivOficial)} (p = 0.5, corrección finita). Sobre marco del sustento (${formatNumber(totalUnivSustento)}): <strong>${moeSustento}</strong>.</span>
      </article>
    </div>

    <div class="info-callout">
      <i class="fas fa-circle-check"></i>
      <div>
        <strong>Universo Oficial de Posgrado integrado (<code>Egresados_Posgrado_2026.xlsx</code>):</strong>
        ${escapeHTML(meta.universoNota || '')}
      </div>
    </div>

    <section class="card table-card" style="margin-bottom: 22px;">
      <div class="section-heading" style="margin-top: 0;">
        <h3>1. Cruce Muestra Alcanzada vs. Universo Oficial por Tipo de Programa (Columna F)</h3>
        <span class="section-count">Muestra filtrada: ${formatNumber(data.length)} · Universo SIIU filtrado: ${formatNumber(totalUnivOficial)}</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de programa</th>
              <th class="num">Universo Oficial (2005–2026)</th>
              <th class="num">% Univ. Oficial</th>
              <th class="num">Universo 2023–2025 (SIIU)</th>
              <th class="num">Marco Sustento (2023–2025)</th>
              <th class="num">Muestra planificada</th>
              <th class="num">Muestra lograda (Total)</th>
              <th class="num">% Muestra</th>
              <th class="num">Muestra 2023–2025</th>
              <th class="num">Tasa cobertura</th>
              <th class="num">Margen error (95%)</th>
            </tr>
          </thead>
          <tbody>
            ${crossTipoRowsHtml}
            <tr style="font-weight: 800; background: #f5f5f5; border-top: 2px solid #d4d4d4;">
              <td>TOTAL</td>
              <td class="num">${formatNumber(totalUnivOficial)}</td>
              <td class="num">100.00%</td>
              <td class="num">${formatNumber(totalUniv2325)}</td>
              <td class="num">${formatNumber(totalUnivSustento)}</td>
              <td class="num">${formatNumber(meta.muestraPlanificadaTotal || 500)}</td>
              <td class="num">${formatNumber(data.length)}</td>
              <td class="num">100.0%</td>
              <td class="num">${formatNumber(total2325Muestra)}</td>
              <td class="num">${samplingRateOficial}%</td>
              <td class="num">${moeOficial}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="rg-note" style="padding: 10px 4px 0;">
        * El padrón oficial SIIU (<code>Egresados_Posgrado_2026.xlsx</code>, N = 25,680) comprende los grados y segundas especialidades de Posgrado (Segunda Especialidad: 19,019; Maestría: 6,365; Doctorado: 296). Para Diplomados (n = 31 en la encuesta) la cobertura y margen de error se calculan sobre el universo de referencia del Sustento Metodológico (N = 444).
      </p>
    </section>

    <div class="tables-grid" style="margin-bottom: 22px;">
      <section class="card table-card">
        <div class="section-heading" style="margin-top: 0;">
          <h3>2. Distribución % Muestra vs. % Universo por Año de Egreso</h3>
          <span class="section-count">Comparativo de cohortes</span>
        </div>
        <div class="chart-container" style="height: 340px;">
          <canvas id="ficha-chart-anio-cruce"></canvas>
        </div>
      </section>

      <section class="card table-card">
        <div class="section-heading" style="margin-top: 0;">
          <h3>Cruce Muestra vs. Universo por Año de Egreso</h3>
          <span class="section-count">${formatNumber(allYears.length)} cohortes con registro</span>
        </div>
        <div class="table-responsive" style="max-height: 340px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Año de egreso</th>
                <th class="num">Universo Oficial</th>
                <th class="num">% Universo</th>
                <th class="num">Muestra lograda</th>
                <th class="num">% Muestra</th>
                <th class="num">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              ${crossAnioRowsHtml}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="card table-card" style="margin-bottom: 22px;">
      <div class="section-heading" style="margin-top: 0;">
        <h3>3. Cruce Muestra vs. Universo por Programa Específico (${formatNumber(progList.length)} programas)</h3>
        <span class="section-count" id="ficha-prog-count">${formatNumber(progsWithSample)} con muestra · ${formatNumber(progList.length)} en total</span>
      </div>
      <div class="nps-filter-bar" style="margin-bottom: 12px;">
        <div class="nps-pills" role="group" aria-label="Filtrar programas">
          <button type="button" class="nps-pill active" data-prog-filter="all">Todos (${formatNumber(progList.length)})</button>
          <button type="button" class="nps-pill" data-prog-filter="withSample">Con muestra (${formatNumber(progsWithSample)})</button>
          <button type="button" class="nps-pill" data-prog-filter="noSample">Sin muestra (${formatNumber(progList.length - progsWithSample)})</button>
        </div>
        <div class="search-box" style="max-width: 340px;">
          <i class="fas fa-magnifying-glass"></i>
          <input type="search" id="ficha-prog-search" placeholder="Buscar programa o especialidad…" autocomplete="off">
        </div>
      </div>
      <div class="table-responsive" style="max-height: 440px; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Programa / Especialidad</th>
              <th>Tipo</th>
              <th class="num">Universo Oficial (2005–2026)</th>
              <th class="num">Universo (2023–2026)</th>
              <th class="num">Muestra lograda</th>
              <th class="num">% Muestra</th>
              <th class="num">Tasa cobertura</th>
              <th class="num">Margen error (95%)</th>
            </tr>
          </thead>
          <tbody id="ficha-prog-tbody"></tbody>
        </table>
      </div>
    </section>

    <section class="card sustento-card">
      <h3><i class="fas fa-file-lines"></i> Sustento metodológico de la muestra y alcance estadístico</h3>
      <p>
        El padrón histórico oficial de la Escuela de Posgrado (<code>Egresados_Posgrado_2026.xlsx</code>) registra un universo acumulado de <strong>25,680 egresados</strong> entre 2005 y 2026 (<strong>19,019</strong> en Segundas Especialidades, <strong>6,365</strong> en Maestrías y <strong>296</strong> en Doctorados), de los cuales <strong>8,606</strong> corresponden a las cohortes 2023–2025 y <strong>10,817</strong> al periodo 2023–2026. Para el diseño muestral de referencia (cohortes 2023–2025, incluyendo Diplomados) se estableció un marco objetivo de <strong>8,374 egresados</strong> y una meta de <strong>500 encuestas completas</strong> asignadas proporcionalmente (<code>nₕ = (Nₕ / N) × 500</code>), superándose la meta con <strong>${formatNumber(totalAll)} encuestas válidas</strong> (${formatNumber(data.length)} con los filtros actuales).
      </p>
      <p>
        <strong>Alcance y precisión estadística:</strong> Con la muestra efectiva alcanzada de <strong>${formatNumber(data.length)} encuestados</strong>, el margen de error teórico agregado al 95% de confianza (p = 0.5 y corrección por población finita) es de <strong>${moeOficial}</strong> respecto al padrón general (N = ${formatNumber(totalUnivOficial)}) y de <strong>${moeSustento}</strong> respecto al marco de referencia 2023–2025 (N = ${formatNumber(totalUnivSustento)}).
      </p>
      <p>
        En consonancia con la estructura del universo, la muestra concentra su mayor volumen en <strong>Segundas Especialidades</strong> (n = ${formatNumber(countByTipoAll.get('Segunda Especialidad') || 0)} de N = ${formatNumber(univFiltered?.byTipo?.get('Segunda Especialidad')?.total ?? 19019)}) y <strong>Maestrías</strong> (n = ${formatNumber(countByTipoAll.get('Maestría') || 0)} de N = ${formatNumber(univFiltered?.byTipo?.get('Maestría')?.total ?? 6365)}). En estratos de menor tamaño como <strong>Doctorados</strong> (n = ${formatNumber(countByTipoAll.get('Doctorado') || 0)} de N = ${formatNumber(univFiltered?.byTipo?.get('Doctorado')?.total ?? 296)}; todas las respuestas del padrón registradas entre las cohortes 2012–2021) y <strong>Diplomados</strong> (n = ${formatNumber(countByTipoAll.get('Diplomado') || 0)} de N = 444 ref.), la lectura desagregada tiene carácter descriptivo y exploratorio.
      </p>
      <ul>
        <li><strong>Control de calidad y cobertura:</strong> Base consolidada a partir de Encuesta de Egresados Posgrado (${formatNumber(countByFuente.get('Encuesta de Egresados Posgrado') || 519)} registros) y Encuesta Inhouse (${formatNumber(countByFuente.get('Encuesta Inhouse') || 121)} registros), cubriendo <strong>${formatNumber(progsWithSample)} programas específicos</strong>.</li>
        <li><strong>Lectura responsable:</strong> La inferencia principal corresponde al conjunto agregado de Posgrado; las aperturas por programa específico con tamaño muestral reducido deben interpretarse de forma referencial.</li>
        <li><strong>Privacidad:</strong> Información tratada de forma confidencial conforme a la Ley N.º 29733 de Protección de Datos Personales.</li>
      </ul>
      <div class="sustento-note">
        <strong>Nota metodológica:</strong> Los márgenes de error reportados son teóricos (bajo supuesto de muestreo aleatorio simple con corrección por población finita) y sirven como referencia técnica de precisión muestral.
      </div>
    </section>

    <div class="tables-grid">
      ${extraTables}
    </div>
  `;

  // Gráfico comparativo por Año de Egreso (cohortes desde 2012 hasta 2026)
  const chartYears = [...allYears].sort((a, b) => Number(a) - Number(b)).filter(y => Number(y) >= 2012);
  if (chartYears.length && window.Charts) {
    const pctMuestraData = chartYears.map(y => {
      const m = countByAnioMuestra.get(y) || 0;
      return data.length > 0 ? Number(((m / data.length) * 100).toFixed(1)) : 0;
    });
    const pctUnivData = chartYears.map(y => {
      const u = univFiltered?.byAnio?.get(y) || 0;
      return totalUnivOficial > 0 ? Number(((u / totalUnivOficial) * 100).toFixed(1)) : 0;
    });

    window.Charts.createGroupedBarChart(
      'ficha-chart-anio-cruce',
      chartYears,
      [
        {
          label: '% Muestra lograda',
          data: pctMuestraData,
          backgroundColor: '#000000',
          borderColor: '#000000'
        },
        {
          label: '% Universo oficial',
          data: pctUnivData,
          backgroundColor: '#DCB17C',
          borderColor: '#DCB17C'
        }
      ],
      {
        yAxisFormat: v => `${v}%`,
        plugins: {
          legend: { display: true, position: 'bottom' },
          datalabels: { display: false }
        }
      }
    );
  }

  // Render interactivo de la Tabla 3 (Programas específicos)
  const tbodyEl = container.querySelector('#ficha-prog-tbody');
  const searchEl = container.querySelector('#ficha-prog-search');
  const countEl = container.querySelector('#ficha-prog-count');
  const filterBtns = container.querySelectorAll('[data-prog-filter]');
  let progMode = 'all';
  let progQuery = '';

  const renderProgRows = () => {
    if (!tbodyEl) return;
    const qNorm = window.DataLoader.normalize(progQuery);
    const filtered = progList.filter(item => {
      if (progMode === 'withSample' && item.mTotal <= 0) return false;
      if (progMode === 'noSample' && item.mTotal > 0) return false;
      if (qNorm) {
        const hay = window.DataLoader.normalize(`${item.programa} ${item.tipo}`);
        if (!hay.includes(qNorm)) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `${formatNumber(filtered.length)} programas mostrados`;
    }

    if (!filtered.length) {
      tbodyEl.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#71717a;padding:18px;">No se encontraron programas con el filtro actual.</td></tr>';
      return;
    }

    tbodyEl.innerHTML = filtered.map(item => {
      const pctM = data.length > 0 && item.mTotal > 0 ? `${((item.mTotal / data.length) * 100).toFixed(1)}%` : '0.0%';
      const cob = item.uTotal && item.uTotal > 0 && item.mTotal > 0
        ? `${((item.mTotal / item.uTotal) * 100).toFixed(2)}%`
        : '—';
      const moe = item.mTotal > 0 ? calcMarginOfError(item.mTotal, item.uTotal) : '—';
      return `
        <tr>
          <td><strong>${escapeHTML(item.programa)}</strong></td>
          <td>${escapeHTML(item.tipo || '—')}</td>
          <td class="num">${item.uTotal != null ? formatNumber(item.uTotal) : '—*'}</td>
          <td class="num">${item.u2326 != null ? formatNumber(item.u2326) : '—'}</td>
          <td class="num"><strong>${formatNumber(item.mTotal)}</strong></td>
          <td class="num">${pctM}</td>
          <td class="num">${cob}</td>
          <td class="num">${moe}</td>
        </tr>
      `;
    }).join('');
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      progMode = btn.dataset.progFilter;
      renderProgRows();
    });
  });

  searchEl?.addEventListener('input', e => {
    progQuery = e.target.value;
    renderProgRows();
  });

  renderProgRows();
}
