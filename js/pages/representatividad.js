// js/pages/representatividad.js — Ficha técnica, sustento metodológico y composición de la muestra.
import { pageHeader, escapeHTML, formatNumber, formatPercent } from './pageUtils.js';

function calcMarginOfError(n, N) {
  if (!n || n <= 0) return '—';
  const z = 1.96;
  const p = 0.5;
  const fpc = N && N > n ? (N - n) / (N - 1) : 1;
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
      <div class="table-responsive" style="max-height: ${options.maxHeight || '380px'}; overflow-y: auto;">
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
  const totalUniverso = meta.universoTotalReferencia || 8374;

  // Contar muestra por Tipo de Programa (Columna F) en toda la base y en 2023-2025
  const tipoCol = window.DataLoader.getFilterColumn('tipoPrograma');
  const anioCol = window.DataLoader.getFilterColumn('anio');
  const countByTipoAll = new Map();
  const countByTipo2325 = new Map();
  const countByFuente = window.DataLoader.countBy(data, ['Fuente']);

  data.forEach(row => {
    const tipo = tipoCol ? String(row[tipoCol] || '').trim() : '';
    const anio = anioCol ? String(row[anioCol] || '').trim() : '';
    if (!tipo) return;
    countByTipoAll.set(tipo, (countByTipoAll.get(tipo) || 0) + 1);
    if (['2023', '2024', '2025'].includes(anio)) {
      countByTipo2325.set(tipo, (countByTipo2325.get(tipo) || 0) + 1);
    }
  });

  const total2325 = [...countByTipo2325.values()].reduce((a, b) => a + b, 0);
  const samplingRate = totalUniverso ? ((data.length / totalUniverso) * 100).toFixed(2) : '—';
  const moeGlobal = calcMarginOfError(data.length, totalUniverso);

  const crossRowsHtml = refList.map(item => {
    const nAll = countByTipoAll.get(item.tipo) || 0;
    const n2325 = countByTipo2325.get(item.tipo) || 0;
    const pctMuestra = data.length ? ((nAll / data.length) * 100).toFixed(1) : '0.0';
    const moe = calcMarginOfError(nAll, item.universo);
    return `
      <tr>
        <td><strong>${escapeHTML(item.label)}</strong></td>
        <td class="num">${formatNumber(item.universo)}</td>
        <td class="num">${item.participacion.toFixed(2)}%</td>
        <td class="num">${formatNumber(item.muestraPlanificada)}</td>
        <td class="num"><strong>${formatNumber(nAll)}</strong></td>
        <td class="num">${pctMuestra}%</td>
        <td class="num">${formatNumber(n2325)}</td>
        <td class="num">${moe}</td>
      </tr>
    `;
  }).join('');

  const fuenteSummary = [...countByFuente.entries()]
    .map(([k, v]) => `${escapeHTML(k)}: ${formatNumber(v)}`)
    .join(' · ');

  const extraTables = [
    { title: 'Tipo de programa (Columna F)', col: tipoCol },
    { title: 'Año de egreso', col: anioCol, sortNumeric: true },
    { title: 'Rango de edad', col: window.DataLoader.resolveColumn(['Rango de Edad']) },
    { title: 'Sexo', col: window.DataLoader.resolveColumn(['Sexo']) },
    { title: 'Fuente de levantamiento', col: window.DataLoader.resolveColumn(['Fuente']) },
    { title: 'Programa específico', col: window.DataLoader.getFilterColumn('programa'), fullWidth: true, maxHeight: '460px' }
  ]
    .filter(t => t.col)
    .map(t => distributionTable(t.title, t.col, data, t))
    .join('');

  container.innerHTML = `
    ${pageHeader(
      'Ficha Técnica',
      'Parámetros de levantamiento de campo, diseño muestral, sustento metodológico y composición de la muestra.'
    )}

    <div class="ficha-summary-grid">
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-calendar-check"></i> Levantamiento de campo</span>
        <span class="ficha-box-value">28.10 – 10.11.2026</span>
        <span class="ficha-box-note">${escapeHTML(meta.campoInicio)} al ${escapeHTML(meta.campoFin)}.<br>${fuenteSummary || 'Encuesta de Egresados Posgrado e Inhouse'}</span>
      </article>
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-users"></i> Muestra efectiva vs. meta</span>
        <span class="ficha-box-value">${formatNumber(data.length)} encuestados</span>
        <span class="ficha-box-note">Base completa: ${formatNumber(totalAll)} registros (meta inicial del sustento: ${formatNumber(meta.muestraPlanificadaTotal || 500)} encuestas).</span>
      </article>
      <article class="ficha-box">
        <span class="ficha-box-label"><i class="fas fa-bullseye"></i> Precisión global (ref. 95%)</span>
        <span class="ficha-box-value">${moeGlobal}</span>
        <span class="ficha-box-note">Tasa de muestreo ref.: ${samplingRate}% sobre universo base de ${formatNumber(totalUniverso)} egresados (p=0.5, corrección finita).</span>
      </article>
    </div>

    <div class="info-callout">
      <i class="fas fa-circle-info"></i>
      <div>
        <strong>Nota sobre el cruce Muestra vs. Universo:</strong> ${escapeHTML(meta.universoPendienteNota || '')}
        <span class="text-muted-inline">(Universo oficial pendiente de actualización — Carlos)</span>
      </div>
    </div>

    <section class="card table-card" style="margin-bottom: 22px;">
      <div class="section-heading" style="margin-top: 0;">
        <h3>Cruce Muestra Alcanzada vs. Universo de Referencia (por Tipo de Programa — Columna F)</h3>
        <span class="section-count">Base: ${formatNumber(data.length)} registros filtrados</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de programa</th>
              <th class="num">Universo ref. (2023–2025)</th>
              <th class="num">% Universo</th>
              <th class="num">Muestra planificada</th>
              <th class="num">Muestra lograda (Total)</th>
              <th class="num">% Muestra</th>
              <th class="num">Muestra 2023–2025</th>
              <th class="num">Margen error teórico</th>
            </tr>
          </thead>
          <tbody>
            ${crossRowsHtml}
            <tr style="font-weight: 800; background: #f5f5f5; border-top: 2px solid #d4d4d4;">
              <td>TOTAL</td>
              <td class="num">${formatNumber(totalUniverso)}</td>
              <td class="num">100.00%</td>
              <td class="num">${formatNumber(meta.muestraPlanificadaTotal || 500)}</td>
              <td class="num">${formatNumber(data.length)}</td>
              <td class="num">100.0%</td>
              <td class="num">${formatNumber(total2325)}</td>
              <td class="num">${moeGlobal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card sustento-card">
      <h3><i class="fas fa-file-lines"></i> Sustento metodológico de la muestra y alcance estadístico</h3>
      <p>
        La población objetivo de referencia comprende <strong>8,374 egresados</strong> de Maestrías, Doctorados, Segundas Especialidades y Diplomados (referencia cohortes 2023–2025). Originalmente se propuso una muestra de <strong>500 encuestas completas</strong> distribuida proporcionalmente según el tamaño de cada grupo (<code>nₕ = (Nₕ / N) × 500</code>), alcanzándose finalmente un levantamiento efectivo de <strong>${formatNumber(totalAll)} respuestas válidas</strong> (${formatNumber(data.length)} con los filtros actuales).
      </p>
      <p>
        <strong>Alcance y precisión estadística:</strong> Con selección dentro de cada estrato, el diseño base de 500 encuestas proyectaba un margen de error teórico de <strong>±4.25%</strong> al 95% de confianza (p = 0.5 y corrección por población finita; tasa de muestreo 5.97%). Con la muestra efectiva alcanzada de <strong>${formatNumber(data.length)} encuestados</strong>, el margen de error teórico agregado se ubica en <strong>${moeGlobal}</strong> sobre el universo de referencia.
      </p>
      <p>
        Sin embargo, la precisión no es equivalente para cada grupo: en estratos con menor número de respuestas como <strong>Doctorados</strong> (n = ${formatNumber(countByTipoAll.get('Doctorado') || 0)}) y <strong>Diplomados</strong> (n = ${formatNumber(countByTipoAll.get('Diplomado') || 0)}), los márgenes de error teóricos son amplios. Por tanto, la inferencia principal corresponde al conjunto agregado de egresados de Posgrado; los resultados por estratos pequeños o programas específicos deben interpretarse con cautela y no como estimaciones de alta precisión poblacional.
      </p>
      <ul>
        <li><strong>Control de calidad y cobertura:</strong> Base consolidada a partir de Encuesta de Egresados Posgrado (519 registros) y Encuesta Inhouse (121 registros).</li>
        <li><strong>Lectura responsable:</strong> Se reportan resultados globales y desagregaciones exploratorias; no se afirma representatividad estadística independiente por programa específico cuando el tamaño muestral es reducido.</li>
        <li><strong>Privacidad:</strong> Información tratada de forma confidencial y agregada conforme a la Ley N.º 29733 de Protección de Datos Personales.</li>
      </ul>
      <div class="sustento-note">
        <strong>Nota metodológica:</strong> Los márgenes de error reportados son teóricos (bajo supuesto de muestreo aleatorio simple dentro de cada estrato) y no aplican automáticamente a encuestas con participación voluntaria o selección por conveniencia.
      </div>
    </section>

    <div class="tables-grid">
      ${extraTables}
    </div>
  `;
}
