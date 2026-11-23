// js/pages/visor-datos.js — Explorador del archivo de respuestas.
import { pageHeader, escapeHTML, formatNumber } from './pageUtils.js';

const PAGE_SIZE = 200;

export async function loadVisorDatosPage(container, data) {
  const state = { query: '', offset: 0 };

  container.innerHTML = `
    ${pageHeader('Visor de Datos', 'Consulta directa del archivo de respuestas con los filtros activos.')}
    <div class="card dataviewer-card">
      <div class="dataviewer-toolbar">
        <div class="search-box">
          <i class="fas fa-magnifying-glass"></i>
          <input type="search" id="dv-search" placeholder="Buscar en cualquier columna…" autocomplete="off">
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span class="dataviewer-count" id="dv-count"></span>
          <button type="button" class="btn btn-sm btn-secondary" id="dv-export-csv" title="Descargar registros filtrados en CSV">
            <i class="fas fa-file-csv"></i> Exportar CSV
          </button>
          <button type="button" class="btn btn-sm btn-secondary" id="dv-export-json" title="Descargar registros filtrados en JSON">
            <i class="fas fa-file-code"></i> Exportar JSON
          </button>
        </div>
      </div>
      <div class="table-responsive" id="dv-table-wrap"></div>
      <div class="dataviewer-footer">
        <button type="button" class="btn btn-sm btn-secondary" id="dv-prev"><i class="fas fa-chevron-left"></i> Anterior</button>
        <span id="dv-page"></span>
        <button type="button" class="btn btn-sm btn-secondary" id="dv-next">Siguiente <i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
  `;

  const wrap = container.querySelector('#dv-table-wrap');
  const countEl = container.querySelector('#dv-count');
  const pageEl = container.querySelector('#dv-page');
  const searchEl = container.querySelector('#dv-search');

  const getFiltered = () => {
    const query = window.DataLoader.normalize(state.query);
    return query
      ? data.filter(row => Object.values(row).some(value => window.DataLoader.normalize(value).includes(query)))
      : data;
  };

  const render = () => {
    const filtered = getFiltered();

    const maxOffset = Math.max(0, Math.floor((filtered.length - 1) / PAGE_SIZE) * PAGE_SIZE);
    if (state.offset > maxOffset) state.offset = maxOffset;
    const pageRows = filtered.slice(state.offset, state.offset + PAGE_SIZE);
    const columns = window.DataLoader.columns;

    countEl.textContent = `${formatNumber(filtered.length)} registros`;
    pageEl.textContent = `Página ${Math.floor(state.offset / PAGE_SIZE) + 1} de ${Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}`;

    if (!pageRows.length) {
      wrap.innerHTML = '<p style="padding:24px;color:#666;">No hay registros que coincidan con la búsqueda.</p>';
      return;
    }

    wrap.innerHTML = `
      <table class="data-table data-table-compact">
        <thead>
          <tr>${columns.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${pageRows.map(row => `
            <tr>${columns.map(c => `<td>${escapeHTML(row[c] == null ? '' : row[c])}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  searchEl?.addEventListener('input', e => {
    state.query = e.target.value;
    state.offset = 0;
    render();
  });

  container.querySelector('#dv-prev')?.addEventListener('click', () => {
    state.offset = Math.max(0, state.offset - PAGE_SIZE);
    render();
  });

  container.querySelector('#dv-next')?.addEventListener('click', () => {
    if (state.offset + PAGE_SIZE < getFiltered().length) {
      state.offset += PAGE_SIZE;
      render();
    }
  });

  container.querySelector('#dv-export-csv')?.addEventListener('click', () => {
    const filtered = getFiltered();
    const columns = window.DataLoader.columns;
    const escCsv = (val) => {
      const s = String(val == null ? '' : val);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      columns.map(escCsv).join(','),
      ...filtered.map(r => columns.map(c => escCsv(r[c])).join(','))
    ];
    window.Exports?.downloadFile('\uFEFF' + lines.join('\n'), 'posgrado_2026_filtrado.csv', 'text/csv;charset=utf-8');
  });

  container.querySelector('#dv-export-json')?.addEventListener('click', () => {
    window.Exports?.exportFilteredData(getFiltered(), 'posgrado_2026_filtrado.json');
  });

  render();
}
