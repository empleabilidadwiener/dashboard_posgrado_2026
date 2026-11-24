/*
 * dataLoader.js — Carga y normalización del archivo de respuestas.
 * No conoce preguntas: solo resuelve columnas y entrega filas limpias.
 */
const DataLoader = {
  rows: [],
  columns: [],
  universo: null,
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

    if (cfg.dataFiles && cfg.dataFiles.universo) {
      try {
        const uRes = await fetch(cfg.dataFiles.universo, { cache: 'no-store' });
        if (uRes.ok) {
          this.universo = await uRes.json();
        }
      } catch (e) {
        console.warn('No se pudo cargar el archivo de universo:', e);
      }
    }

    this.isLoaded = true;
    this.error = null;
    return this.rows;
  },

  getFilteredUniverse(filters = {}) {
    if (!this.universo || !Array.isArray(this.universo.cells)) return null;
    const selAnio = filters.anio && filters.anio !== 'Todos' ? String(filters.anio).trim() : null;
    const selTipo = filters.tipoPrograma && filters.tipoPrograma !== 'Todos' ? this.normalize(filters.tipoPrograma) : null;
    const selProg = filters.programa && filters.programa !== 'Todos' ? this.normalize(filters.programa) : null;

    let total = 0;
    let total2325 = 0;
    let total2326 = 0;
    const byTipo = new Map();
    const byAnio = new Map();
    const byPrograma = new Map();
    const bySexo = new Map();

    this.universo.cells.forEach(cell => {
      const anio = String(cell.a || '').trim();
      const tipo = String(cell.t || '').trim();
      const prog = String(cell.p || '').trim();
      const sexo = String(cell.s || '').trim();
      const n = Number(cell.n || 0);
      if (!n) return;

      if (selAnio && anio !== selAnio) return;
      if (selTipo && this.normalize(tipo) !== selTipo) return;
      if (selProg && this.normalize(prog) !== selProg) return;

      total += n;
      const is2325 = anio === '2023' || anio === '2024' || anio === '2025';
      const is2326 = is2325 || anio === '2026';
      if (is2325) total2325 += n;
      if (is2326) total2326 += n;

      if (tipo) {
        const t = byTipo.get(tipo) || { total: 0, c2325: 0, c2326: 0 };
        t.total += n;
        if (is2325) t.c2325 += n;
        if (is2326) t.c2326 += n;
        byTipo.set(tipo, t);
      }
      if (anio) {
        byAnio.set(anio, (byAnio.get(anio) || 0) + n);
      }
      if (prog) {
        const pNorm = this.normalize(prog);
        const p = byPrograma.get(pNorm) || { programa: prog, tipo, total: 0, c2325: 0, c2326: 0 };
        p.total += n;
        if (is2325) p.c2325 += n;
        if (is2326) p.c2326 += n;
        byPrograma.set(pNorm, p);
      }
      if (sexo) {
        bySexo.set(sexo, (bySexo.get(sexo) || 0) + n);
      }
    });

    return { total, total2325, total2326, byTipo, byAnio, byPrograma, bySexo };
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
