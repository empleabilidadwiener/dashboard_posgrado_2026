// js/pages/situacion-laboral.js
import { renderFamilyPage } from './familyPage.js';
import { kpiCard, computeAverageSalary, formatNumber, formatPercent } from './pageUtils.js';

export async function loadSituacionLaboralPage(container, data) {
  const colTrabaja = window.DataLoader.resolveColumn(['¿Actualmente se encuentra trabajando?']);
  const colSector = window.DataLoader.resolveColumn(['Sector al que pertenece la empresa actual donde trabajas:']);
  const salary = computeAverageSalary(data);

  let trabajando = 0;
  let totalTrabaja = 0;
  let publica = 0;
  let totalSector = 0;

  data.forEach(row => {
    if (colTrabaja && row[colTrabaja]) {
      const v = window.DataLoader.normalize(row[colTrabaja]);
      if (v && v !== 'no especifica') {
        totalTrabaja += 1;
        if (v === 'si') trabajando += 1;
      }
    }
    if (colSector && row[colSector]) {
      const v = window.DataLoader.normalize(row[colSector]);
      if (v && v !== 'no especifica') {
        totalSector += 1;
        if (v.includes('public')) publica += 1;
      }
    }
  });

  const kpisHtml = [
    kpiCard('Trabajando actualmente', totalTrabaja ? formatPercent(trabajando, totalTrabaja, 1) : '—', `${formatNumber(trabajando)} de ${formatNumber(totalTrabaja)}`, 'fas fa-briefcase'),
    kpiCard('Sector público', totalSector ? formatPercent(publica, totalSector, 1) : '—', `${formatNumber(publica)} en sector público · ${formatNumber(totalSector - publica)} privado`, 'fas fa-building'),
    kpiCard('Ingreso mensual promedio', salary ? `S/ ${formatNumber(salary.average)}` : '—', salary ? `Base: ${formatNumber(salary.count)} con monto declarado` : 'Sin datos', 'fas fa-money-bill-wave')
  ].join('');

  renderFamilyPage(container, {
    pageId: 'situacion-laboral',
    title: 'Situación Laboral',
    subtitle: 'Condición de ocupación, vínculo contractual, empresa, cargo, liderazgo, ubicación e ingresos.',
    familyMatchers: ['situacion laboral', 'condiciones', 'cargo', 'ingresos', 'ubicacion', 'perfil'],
    kpisHtml
  });
}
