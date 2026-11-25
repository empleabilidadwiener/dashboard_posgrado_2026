// js/pages/metodologia.js — Nota metodológica e instrumento oficial del estudio.
import { pageHeader, formatNumber } from './pageUtils.js';

function openInstrumentModal() {
  let modal = document.getElementById('posgrado-instrumento-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'posgrado-instrumento-modal';
    modal.className = 'modal-instrumento-wrapper';
    modal.innerHTML = `
      <div class="modal-instrumento-backdrop" id="inst-modal-backdrop"></div>
      <div class="modal-instrumento-container" role="dialog" aria-modal="true" aria-labelledby="inst-modal-title">
        <div class="modal-instrumento-header">
          <div class="modal-instrumento-brand">
            <span class="modal-instrumento-tag"><i class="fas fa-clipboard-list"></i> Instrumento Oficial VR_FINAL</span>
            <h3 id="inst-modal-title" class="modal-instrumento-title">Encuesta de Egresados — Posgrado 2026</h3>
            <p class="modal-instrumento-subtitle">Escuela de Posgrado · Universidad Norbert Wiener · Ley N.° 29733</p>
          </div>
          <button type="button" class="modal-instrumento-close" id="inst-modal-close" aria-label="Cerrar instrumento">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-instrumento-body">
          <div class="inst-section">
            <div class="inst-section-title"><span class="inst-num">01</span> Identificación del egresado</div>
            <div class="inst-card">
              <span class="inst-badge-q">Datos de registro</span>
              <p class="inst-question-text">Nombres y apellidos · Nombre del programa de posgrado · Año de egreso · Teléfono · Correo electrónico</p>
            </div>
          </div>

          <div class="inst-section">
            <div class="inst-section-title"><span class="inst-num">02</span> Situación laboral y condiciones de empleo</div>
            <div class="inst-card">
              <span class="inst-badge-q">P1</span>
              <p class="inst-question-text">¿Actualmente se encuentra trabajando? (Sí / No)</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P2</span>
              <p class="inst-question-text">Si trabaja, ¿cuál es su condición laboral actual? (Dependiente plazo indeterminado / Plazo fijo-CAS / Independiente / Negocio propio o familiar)</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P3–P6</span>
              <p class="inst-question-text">Empresa, cargo actual, distrito donde labora, sector (Público / Privado), tiempo en el cargo y personal a cargo.</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P7–P9</span>
              <p class="inst-question-text">Ingreso mensual bruto aproximado, variación de ingreso tras culminar el posgrado y satisfacción con el trabajo actual.</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P10–P12</span>
              <p class="inst-question-text">Mejoras laborales tras el posgrado (selección múltiple), tiempo hasta el cambio, y si no trabaja, principal razón (búsqueda de empleo, estudios, motivos personales, salud o emprendimiento).</p>
            </div>
          </div>

          <div class="inst-section">
            <div class="inst-section-title"><span class="inst-num">03</span> Impacto del programa, formación continua y NPS</div>
            <div class="inst-card">
              <span class="inst-badge-q">P13–P15</span>
              <p class="inst-question-text">Motivación principal para estudiar el posgrado (múltiple), contribución al perfil profesional y satisfacción con la formación recibida.</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P16–P19</span>
              <p class="inst-question-text">Participación en la red de egresados Wiener, interés en continuar estudios (Diplomado, Segunda Especialidad, Maestría o Doctorado) y recepción de oportunidades laborales.</p>
            </div>
            <div class="inst-card">
              <span class="inst-badge-q">P20–P21</span>
              <p class="inst-question-text">Recomendación UNW en escala 0–10 (NPS) y razón principal de la calificación otorgada (abierta y categorizada).</p>
            </div>
          </div>
        </div>
        <div class="chart-fullscreen-footer">
          <span class="chart-fullscreen-hint">Fuente: Instrumento -Encuesta de egresados-2E-Posgrado (VR_FINAL).docx</span>
          <button type="button" class="btn btn-sm btn-primary" id="inst-modal-close-footer">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };
    modal.querySelector('#inst-modal-backdrop')?.addEventListener('click', close);
    modal.querySelector('#inst-modal-close')?.addEventListener('click', close);
    modal.querySelector('#inst-modal-close-footer')?.addEventListener('click', close);
  }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export async function loadMetodologiaPage(container, data) {
  const cfg = window.POSGRADO_CONFIG;

  container.innerHTML = `
    ${pageHeader('Metodología', 'Cómo se construyen los indicadores, reglas de cálculo y estructura del instrumento.')}
    <div style="margin-bottom: 18px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button type="button" class="btn btn-primary btn-sm" id="btn-open-instrumento">
        <i class="fas fa-file-alt"></i> Ver Instrumento Oficial
      </button>
    </div>
    <div class="method-grid">
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-clipboard-list"></i></div>
        <h3>Instrumento</h3>
        <p>Cuestionario de empleabilidad aplicado a egresados de Posgrado de la Universidad Norbert Wiener (<code>VR_FINAL</code>). Documentado en <code>docs/instrumento_posgrado.md</code>.</p>
      </section>
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-database"></i></div>
        <h3>Base de datos y Universo</h3>
        <p>${formatNumber(data.length)} registros válidos cargados desde <code>${cfg.dataFiles.encuestas}</code> (519 vía Encuesta de Egresados Posgrado y 7 vía Encuesta Inhouse), contrastados con el universo oficial <code>Universo_Estudio de Empleabilidad Posgrado.xlsx</code> (8,060 egresados en 58 programas).</p>
      </section>
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-briefcase"></i></div>
        <h3>Cálculo de Empleabilidad (PEA)</h3>
        <p>El <strong>Nivel de Empleabilidad Final</strong> se calcula exclusivamente sobre la <strong>Población Económicamente Activa (PEA)</strong> (empleados + desempleados en búsqueda activa), excluyendo del denominador a los egresados <strong>No PEA</strong> (dedicados 100% a estudios, motivos personales o salud).</p>
      </section>
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-calculator"></i></div>
        <h3>Cálculo de indicadores y NPS</h3>
        <p>En preguntas de selección múltiple (mejoras laborales y motivaciones), los porcentajes se calculan sobre encuestados válidos. El <strong>NPS</strong> equivale a % promotores (9–10) menos % detractores (0–6) sobre respuestas con nota válida.</p>
      </section>
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-filter"></i></div>
        <h3>Cruces y filtros</h3>
        <p>Todas las preguntas de Resultados Generales permiten cruces por <strong>Año de egreso</strong> (Col. J), <strong>Tipo de programa</strong> (Col. F) y <strong>Programa específico</strong> (Col. G), además de filtrado global en la barra superior.</p>
      </section>
      <section class="card method-card">
        <div class="method-icon"><i class="fas fa-shield-halved"></i></div>
        <h3>Confidencialidad y lectura</h3>
        <p>Datos tratados de forma agregada conforme a la Ley N.º 29733. Los porcentajes en categorías con tamaño muestral reducido deben interpretarse con cautela considerando el valor <em>n</em> de cada tarjeta.</p>
      </section>
    </div>
  `;

  container.querySelector('#btn-open-instrumento')?.addEventListener('click', openInstrumentModal);
}
