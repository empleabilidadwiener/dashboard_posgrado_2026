// js/pages/empleabilidad.js
import { renderFamilyPage } from './familyPage.js';
import { kpiCard, formatNumber, formatPercent } from './pageUtils.js';

export async function loadEmpleabilidadPage(container, data) {
  const colEmp = window.DataLoader.resolveColumn(['Nivel de Empleabilidad Final']);
  const colSatTrab = window.DataLoader.resolveColumn(['¿Qué tan satisfecho te sientes con tu trabajo actual?']);
  const colSatForm = window.DataLoader.resolveColumn(['¿Cuál es tu nivel de satisfacción con la formación recibida en el programa de posgrado?']);

  let empSi = 0;
  let empTot = 0;
  let satTrabPos = 0;
  let satTrabTot = 0;
  let satFormPos = 0;
  let satFormTot = 0;

  data.forEach(row => {
    if (colEmp && row[colEmp]) {
      empTot += 1;
      if (window.DataLoader.normalize(row[colEmp]) === 'si') empSi += 1;
    }
    if (colSatTrab && row[colSatTrab]) {
      const v = window.DataLoader.normalize(row[colSatTrab]);
      if (v !== 'no especifica') {
        satTrabTot += 1;
        if (v === 'muy satisfecho' || v === 'satisfecho') satTrabPos += 1;
      }
    }
    if (colSatForm && row[colSatForm]) {
      const v = window.DataLoader.normalize(row[colSatForm]);
      if (v !== 'no especifica') {
        satFormTot += 1;
        if (v === 'muy satisfecho' || v === 'satisfecho') satFormPos += 1;
      }
    }
  });

  const kpisHtml = [
    kpiCard('Empleabilidad (sobre PEA)', empTot ? formatPercent(empSi, empTot, 1) : '—', `${formatNumber(empSi)} empleados de ${formatNumber(empTot)} PEA`, 'fas fa-chart-line'),
    kpiCard('Satisfacción laboral', satTrabTot ? formatPercent(satTrabPos, satTrabTot, 1) : '—', `${formatNumber(satTrabPos)} satisfechos o muy satisfechos`, 'fas fa-face-smile'),
    kpiCard('Satisfacción con el posgrado', satFormTot ? formatPercent(satFormPos, satFormTot, 1) : '—', `${formatNumber(satFormPos)} de ${formatNumber(satFormTot)} válidos`, 'fas fa-thumbs-up')
  ].join('');

  renderFamilyPage(container, {
    pageId: 'empleabilidad',
    title: 'Empleabilidad',
    subtitle: 'Nivel de empleabilidad sobre PEA, evolución salarial, mejoras laborales, satisfacción y contribución al perfil profesional.',
    familyMatchers: ['empleabilidad', 'impacto salarial', 'satisfaccion'],
    kpisHtml
  });
}
