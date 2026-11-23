/*
 * dataLoader.js — Carga y normalización del archivo de respuestas.
 * No conoce preguntas: solo resuelve columnas y entrega filas limpias.
 */
const DataLoader = {
  rows: [],
  columns: [],
  resolvedFilters: {},
  isLoaded: false,
  error: null,

  normalize(value) {
    return String(value == null ? '' : value)
      .replace(/\u0000|_x0000_/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  },

  cleanCell(value) {
    if (value == null) return '';
    if (typeof value === 'string') {
      return value.replace(/\u0000|_x0000_/g, '').trim();
    }
    return value;
  },

  cleanRows(rawRows) {
    return rawRows
      .filter(row => row && Object.keys(row).length > 0)
      .map(row => {
        const clean = {};
        Object.keys(row).forEach(key => {
          const cleanKey = String(key).replace(/\u0000|_x0000_/g, '').trim();
          clean[cleanKey] = this.cleanCell(row[key]);
        });
        return clean;
      });
  },

  /**
   * Busca la primera columna real que coincida con alguno de los alias.
   * Primero intenta coincidencia exacta normalizada; luego coincidencia parcial.
   */
  resolveColumn(aliases) {
    const list = Array.isArray(aliases) ? aliases : [aliases];
    const normalizedColumns = this.columns.map(c => ({ original: c, norm: this.normalize(c) }));

    for (const alias of list) {
      const target = this.normalize(alias);
      if (!target) continue;
      const exact = normalizedColumns.find(c => c.norm === target);
      if (exact) return exact.original;
    }
    for (const alias of list) {
      const target = this.normalize(alias);
      if (!target) continue;
      const partial = normalizedColumns.find(c => c.norm.includes(target) || target.includes(c.norm));
      if (partial) return partial.original;
    }
    return null;
  },

  async load() {
    const cfg = window.POSGRADO_CONFIG;
    const url = cfg.dataFiles.encuestas;
    if (!url) throw new Error('No hay archivo de respuestas configurado en config.js');

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se encontró el archivo de datos: ${url}`);

    let rawRows = [];
    let explicitColumns = null;

    if (/\.json$/i.test(url)) {
      const payload = await response.json();
      if (Array.isArray(payload)) {
        rawRows = payload;
      } else if (payload && Array.isArray(payload.rows)) {
        rawRows = payload.rows;
        if (Array.isArray(payload.columns)) {
          explicitColumns = payload.columns.map(c => String(c).replace(/\u0000|_x0000_/g, '').trim()).filter(Boolean);
        }
      } else {
        throw new Error('Formato JSON inválido: se esperaba un arreglo o un objeto con la propiedad "rows".');
      }
      if (!rawRows.length) throw new Error('El archivo JSON de datos está vacío');
    } else {
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength) throw new Error('El archivo de datos está vacío');

      const isCsv = /\.csv$/i.test(url);
      const workbook = isCsv
        ? XLSX.read(buffer, { type: 'array', raw: true, codepage: 65001 })
        : XLSX.read(buffer, { type: 'array', raw: true });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    }

    this.rows = this.cleanRows(rawRows);
    this.columns = explicitColumns && explicitColumns.length
      ? explicitColumns
      : (this.rows.length ? Object.keys(this.rows[0]) : []);

    this.resolvedFilters = {};
    (cfg.filters || []).forEach(filter => {
      this.resolvedFilters[filter.id] = this.resolveColumn(filter.columns);
    });

    this.isLoaded = true;
    this.error = null;
    return this.rows;
  },

  getFilterColumn(filterId) {
    return this.resolvedFilters[filterId] || null;
  },

  getValue(row, column) {
    return column ? row[column] : '';
  },

  getOptions(filterId) {
    const column = this.getFilterColumn(filterId);
    if (!column) return [];
    const values = this.rows
      .map(row => row[column])
      .filter(v => v !== '' && v != null)
      .map(v => String(v).trim());
    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );
  },

  applyFilters(filters = {}) {
    const cfg = window.POSGRADO_CONFIG;
    return this.rows.filter(row => {
      return (cfg.filters || []).every(filter => {
        const selected = filters[filter.id];
        if (!selected || selected === 'Todos') return true;
        const column = this.getFilterColumn(filter.id);
        if (!column) return true;
        return String(row[column]).trim() === String(selected).trim();
      });
    });
  },

  getColumnValues(rows, columnOrAliases) {
    const column = Array.isArray(columnOrAliases)
      ? this.resolveColumn(columnOrAliases)
      : (this.columns.includes(columnOrAliases)
        ? columnOrAliases
        : this.resolveColumn([columnOrAliases]));
    if (!column) return [];
    return rows
      .map(row => row[column])
      .filter(v => v !== '' && v != null)
      .map(v => String(v).trim());
  },

  countBy(rows, columnOrAliases) {
    const counts = new Map();
    this.getColumnValues(rows, columnOrAliases).forEach(value => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }
};

window.DataLoader = DataLoader;
