// js/pages/formacion-continua.js
import { renderFamilyPage } from './familyPage.js';
import { kpiCard, formatNumber, formatPercent } from './pageUtils.js';

export async function loadFormacionContinuaPage(container, data) {
  const colCont = window.DataLoader.resolveColumn(['¿Te interesa continuar estudios en la Universidad Norbert Wiener?']);
  const colRed = window.DataLoader.resolveColumn(['¿Te gustaría participar en actividades de la red de egresados Wiener?']);
  const colOport = window.DataLoader.resolveColumn(['¿Te gustaría recibir oportunidades laborales y actividades alumni?']);

  let contSi = 0, contTot = 0;
  let redSi = 0, redTot = 0;
  let oportSi = 0, oportTot = 0;

  data.forEach(row => {
    if (colCont && row[colCont]) {
      contTot += 1;
      if (window.DataLoader.normalize(row[colCont]) === 'si') contSi += 1;
    }
    if (colRed && row[colRed]) {
      const v = window.DataLoader.normalize(row[colRed]);
      if (v !== 'no especifica') {
        redTot += 1;
        if (v === 'si') redSi += 1;
      }
    }
    if (colOport && row[colOport]) {
      const v = window.DataLoader.normalize(row[colOport]);
      if (v !== 'no especifica') {
        oportTot += 1;
        if (v === 'si') oportSi += 1;
      }
    }
  });

  const kpisHtml = [
    kpiCard('Interés en continuar estudios', contTot ? formatPercent(contSi, contTot, 1) : '—', `${formatNumber(contSi)} de ${formatNumber(contTot)} interesados`, 'fas fa-graduation-cap'),
    kpiCard('Participar en Red Alumni', redTot ? formatPercent(redSi, redTot, 1) : '—', `${formatNumber(redSi)} interesados`, 'fas fa-handshake'),
    kpiCard('Recibir oportunidades laborales', oportTot ? formatPercent(oportSi, oportTot, 1) : '—', `${formatNumber(oportSi)} de ${formatNumber(oportTot)} válidos`, 'fas fa-envelope-open-text')
  ].join('');

  renderFamilyPage(container, {
    pageId: 'formacion-continua',
    title: 'Formación Continua',
    subtitle: 'Motivaciones de estudio, continuidad académica en la UNW y vinculación con la red de egresados.',
    familyMatchers: ['motivacion', 'vinculacion', 'formacion'],
    kpisHtml
  });
}
