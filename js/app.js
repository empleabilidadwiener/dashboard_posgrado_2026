// js/app.js — Router principal del dashboard de Posgrado.
import { loadResumenPage } from './pages/resumen.js';
import { loadResultadosGeneralesPage } from './pages/resultados-generales.js';
import { loadSituacionLaboralPage } from './pages/situacion-laboral.js';
import { loadEmpleabilidadPage } from './pages/empleabilidad.js';
import { loadFormacionContinuaPage } from './pages/formacion-continua.js';
import { loadMetodologiaPage } from './pages/metodologia.js';
import { loadRepresentatividadPage } from './pages/representatividad.js';
import { loadPreguntasAbiertasPage } from './pages/preguntas-abiertas.js';
import { loadVisorDatosPage } from './pages/visor-datos.js';

const App = {
  currentPage: 'resumen',
  filters: { anio: 'Todos', tipoPrograma: 'Todos', programa: 'Todos' },

  init() {
    this.setupSidebarToggle();
    this.setupNavigation();
    this.setupFilters();
    this.loadData();
  },

  setupSidebarToggle() {
    const appContainer = document.querySelector('.app-container') || document.body;
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const expandBtn = document.getElementById('sidebar-expand-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const toggleSidebar = forceState => {
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        return;
      }
      const shouldCollapse = forceState !== undefined
        ? forceState
        : !appContainer.classList.contains('sidebar-collapsed');
      appContainer.classList.toggle('sidebar-collapsed', shouldCollapse);
      localStorage.setItem('sidebar_collapsed', String(shouldCollapse));
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    };

    collapseBtn?.addEventListener('click', e => { e.stopPropagation(); toggleSidebar(true); });
    expandBtn?.addEventListener('click', e => { e.stopPropagation(); toggleSidebar(false); });

    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const active = document.activeElement;
        if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
        e.preventDefault();
        toggleSidebar();
      }
    });

    if (window.innerWidth > 1024 && localStorage.getItem('sidebar_collapsed') === 'true') {
      appContainer.classList.add('sidebar-collapsed');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
    }
  },

  setupNavigation() {
    const navigate = page => {
      if (page && window.DataLoader.isLoaded) this.navigateTo(page);
    };

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); navigate(item.dataset.page); });
    });
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); navigate(item.dataset.page); });
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openSidebar = () => { sidebar?.classList.add('open'); overlay?.classList.add('active'); };
    const closeSidebar = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); };

    document.getElementById('mobile-btn-menu')?.addEventListener('click', () =>
      sidebar?.classList.contains('open') ? closeSidebar() : openSidebar()
    );
    document.getElementById('bottom-menu-toggle')?.addEventListener('click', () =>
      sidebar?.classList.contains('open') ? closeSidebar() : openSidebar()
    );
    document.getElementById('sidebar-mobile-close-btn')?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);
  },

  setupFilters() {
    const cfg = window.POSGRADO_CONFIG;

    cfg.filters.forEach(filter => {
      const select = document.getElementById(filter.selectId || `filter-${filter.id}`);
      select?.addEventListener('change', e => {
        this.filters[filter.id] = e.target.value;
        if (filter.id === 'tipoPrograma') this.refreshProgramaOptions();
        this.applyFilters();
      });
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      cfg.filters.forEach(filter => {
        this.filters[filter.id] = 'Todos';
        const select = document.getElementById(filter.selectId || `filter-${filter.id}`);
        if (select) select.value = 'Todos';
      });
      this.refreshProgramaOptions();
      this.applyFilters();
    });
  },

  async loadData() {
    const loadError = document.getElementById('load-error');
    const loading = document.getElementById('loading');
    const pageContent = document.getElementById('page-content');

    loadError?.classList.add('hidden');
    loading?.classList.remove('hidden');

    try {
      await window.DataLoader.load();
      this.populateFilters();
      if (loading) loading.classList.add('hidden');
      this.navigateTo('resumen');
    } catch (error) {
      console.error('No se pudieron cargar los datos:', error);
      if (loading) loading.classList.add('hidden');
      if (loadError) {
        loadError.classList.remove('hidden');
        const detail = document.getElementById('load-error-detail');
        if (detail) detail.textContent = error.message || 'Error inesperado.';
      }
      if (pageContent) pageContent.innerHTML = '';
    }
  },

  populateFilters() {
    const cfg = window.POSGRADO_CONFIG;
    cfg.filters.forEach(filter => {
      if (filter.id === 'programa') return;
      const select = document.getElementById(filter.selectId || `filter-${filter.id}`);
      if (!select) return;
      const options = window.DataLoader.getOptions(filter.id);
      select.innerHTML = `<option value="Todos">${filter.placeholder || 'Todos'}</option>` +
        options.map(value => `<option value="${escapeAttribute(value)}">${escapeHTML(value)}</option>`).join('');
    });
    this.refreshProgramaOptions();
  },

  refreshProgramaOptions() {
    const cfg = window.POSGRADO_CONFIG;
    const filter = cfg.filters.find(f => f.id === 'programa');
    if (!filter) return;
    const select = document.getElementById(filter.selectId || 'filter-programa');
    if (!select) return;

    let rows = window.DataLoader.rows;
    if (this.filters.tipoPrograma && this.filters.tipoPrograma !== 'Todos') {
      const tipoColumn = window.DataLoader.getFilterColumn('tipoPrograma');
      if (tipoColumn) {
        rows = rows.filter(row => String(row[tipoColumn]).trim() === this.filters.tipoPrograma);
      }
    }

    const programaColumn = window.DataLoader.getFilterColumn('programa');
    const values = programaColumn
      ? [...new Set(rows.map(row => String(row[programaColumn] || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      : [];

    select.innerHTML = `<option value="Todos">${filter.placeholder || 'Todos'}</option>` +
      values.map(value => `<option value="${escapeAttribute(value)}">${escapeHTML(value)}</option>`).join('');

    if (!values.includes(this.filters.programa) && this.filters.programa !== 'Todos') {
      this.filters.programa = 'Todos';
    }
    select.value = this.filters.programa;
  },

  getFilteredData() {
    return window.DataLoader.applyFilters(this.filters);
  },

  applyFilters() {
    this.navigateTo(this.currentPage);
  },

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');

    const pageContent = document.getElementById('page-content');
    if (pageContent) {
      pageContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando…</p></div>';
    }
    setTimeout(() => this.loadPage(page), 80);
  },

  async loadPage(page) {
    const filtersBar = document.getElementById('filters-bar');
    if (filtersBar) filtersBar.classList.toggle('hidden', page === 'metodologia');

    const data = this.getFilteredData();
    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    try {
      switch (page) {
        case 'resumen': await loadResumenPage(pageContent, data); break;
        case 'resultados-generales': await loadResultadosGeneralesPage(pageContent, data); break;
        case 'situacion-laboral': await loadSituacionLaboralPage(pageContent, data); break;
        case 'empleabilidad': await loadEmpleabilidadPage(pageContent, data); break;
        case 'formacion-continua': await loadFormacionContinuaPage(pageContent, data); break;
        case 'metodologia': await loadMetodologiaPage(pageContent, data); break;
        case 'representatividad': await loadRepresentatividadPage(pageContent, data); break;
        case 'preguntas-abiertas': await loadPreguntasAbiertasPage(pageContent, data); break;
        case 'visor-datos': await loadVisorDatosPage(pageContent, data); break;
        default:
          pageContent.innerHTML = '<div class="empty-state"><h3>Página no encontrada</h3></div>';
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
      if (window.Charts?.attachFullscreenButtons) {
        setTimeout(() => window.Charts.attachFullscreenButtons(), 120);
        setTimeout(() => window.Charts.attachFullscreenButtons(), 500);
      }
      if (window.Editor?.onPageChange) {
        window.Editor.onPageChange(page);
      }
    } catch (error) {
      console.error(`Error cargando ${page}:`, error);
      pageContent.innerHTML = `
        <div class="empty-state" style="padding: 60px 20px; text-align: center;">
          <i class="fas fa-exclamation-circle" style="font-size: 40px; color: #c53030; margin-bottom: 12px;"></i>
          <h3 style="color:#111; margin-bottom:8px;">Error al cargar la página</h3>
          <p style="color:#666;">${escapeHTML(error.message || 'Error inesperado.')}</p>
        </div>
      `;
    }
  }
};

function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
