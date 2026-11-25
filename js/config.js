/*
 * config.js — Configuración central del Dashboard de Empleabilidad Posgrado 2026.
 *
 * Fuente oficial: data/Base de Datos_Estudio de Egresados_Posgrado_V4_corregido.xlsx
 * Universo oficial: data/Universo_Estudio de Empleabilidad Posgrado.xlsx
 * Columnas configuradas según las columnas resaltadas en amarillo en la base
 * y el Instrumento oficial de Posgrado (VR_FINAL).
 */
window.POSGRADO_CONFIG = {
  title: 'Encuesta de Empleabilidad de Posgrado 2026',
  subtitle: 'Escuela de Posgrado · Universidad Norbert Wiener',

  dataFiles: {
    // Formato nativo JSON generado desde el Excel/CSV limpio (carga instantánea).
    // Para actualizar datos: edita data/respuestas_posgrado_2026.csv y ejecuta:
    //   python3 tools/transformar_datos.py --source csv
    encuestas: 'data/respuestas_posgrado_2026.json',
    csvEditable: 'data/respuestas_posgrado_2026.csv',
    universo: 'data/universo_posgrado_2026.json',
    universoExcel: 'data/Universo_Estudio de Empleabilidad Posgrado.xlsx',
    evolutivo: null
  },

  // Ficha técnica y parámetros de campo con el Universo Oficial consolidado (Universo_Estudio de Empleabilidad Posgrado.xlsx).
  studyMeta: {
    campoInicio: '28 de octubre de 2026',
    campoFin: '10 de noviembre de 2026',
    campoNota: 'Levantamiento de campo realizado del 28.10 al 10.11.2026 (Encuesta de Egresados Posgrado e Inhouse).',
    universoReferencia: [
      { tipo: 'Segunda Especialidad', label: 'Segundas Especialidades', universoOficial: 5178, participacion: 64.24, muestraPlanificada: 333 },
      { tipo: 'Maestría', label: 'Maestrías', universoOficial: 2300, participacion: 28.54, muestraPlanificada: 127 },
      { tipo: 'Doctorado', label: 'Doctorados', universoOficial: 308, participacion: 3.82, muestraPlanificada: 13 },
      { tipo: 'Diplomado', label: 'Diplomados', universoOficial: 274, participacion: 3.40, muestraPlanificada: 27 }
    ],
    universoTotalOficial: 8060,
    muestraPlanificadaTotal: 500,
    universoNota: 'Cruce elaborado con el padrón oficial Universo_Estudio de Empleabilidad Posgrado.xlsx (8,060 egresados en 58 programas: 5,178 Segundas Especialidades, 2,300 Maestrías, 308 Doctorados y 274 Diplomados) frente a la base depurada V4 (526 encuestas válidas).'
  },

  // Columnas de los filtros globales.
  // Columna J = Año de Egreso | Columna F = Programa (tipo) | Columna G = Nombre del Programa y/o Especialidad.
  filters: [
    {
      id: 'anio',
      selectId: 'filter-anio',
      label: 'Año de egreso',
      placeholder: 'Todos los años',
      columns: ['Año de Egreso', 'Año de egreso']
    },
    {
      id: 'tipoPrograma',
      selectId: 'filter-tipo',
      label: 'Tipo de programa',
      placeholder: 'Todos los tipos',
      columns: ['Programa']
    },
    {
      id: 'programa',
      selectId: 'filter-programa',
      label: 'Programa específico',
      placeholder: 'Todos los programas',
      columns: ['Nombre del Programa y/o Especialidad']
    }
  ],

  // Cruces que se generan automáticamente para cada pregunta de Resultados Generales.
  crossFields: ['anio', 'tipoPrograma', 'programa'],

  // Catálogo completo de preguntas (un gráfico por pregunta + cruces por año, tipo de programa y programa).
  questions: [
    // --- Situación Laboral ---
    {
      id: 'pea',
      titulo: 'Población Económicamente Activa (PEA / No PEA)',
      column: 'PEA',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Situación Laboral',
      icono: 'fas fa-user-check',
      pagina: 'situacion-laboral',
      orden: ['PEA', 'NO PEA']
    },
    {
      id: 'condicion_laboral',
      titulo: '¿Cuál es tu condición laboral actual?',
      column: '¿Cuál es tu condición laboral actual?',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Situación Laboral',
      icono: 'fas fa-file-signature',
      pagina: 'situacion-laboral'
    },
    {
      id: 'sector_empresa',
      titulo: 'Sector al que pertenece la empresa actual donde trabajas',
      column: 'Sector al que pertenece la empresa actual donde trabajas:',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Condiciones e Inserción',
      icono: 'fas fa-building',
      pagina: 'situacion-laboral',
      orden: ['Pública', 'Privada']
    },
    {
      id: 'tamano_empresa',
      titulo: 'Tamaño de empresa (Ley N.° 30056)',
      column: 'Tamaño de Empresa (Ley N°30056)',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Condiciones e Inserción',
      icono: 'fas fa-industry',
      pagina: 'situacion-laboral'
    },
    {
      id: 'empresa_limpia',
      titulo: 'Principales instituciones o empresas empleadoras (Top 10)',
      column: 'Nombre de Empresa Limpia',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Condiciones e Inserción',
      icono: 'fas fa-hospital',
      pagina: 'situacion-laboral',
      topN: 10,
      excluir: ['No especifica', 'Sin dato']
    },
    {
      id: 'cargo_categorizado',
      titulo: 'Cargo actual (categorizado — Top 10)',
      column: 'Cargo Actual - Categorizado',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Cargo y Liderazgo',
      icono: 'fas fa-user-tie',
      pagina: 'situacion-laboral',
      topN: 10
    },
    {
      id: 'nivel_cargo',
      titulo: 'Nivel jerárquico del cargo actual',
      column: 'Nivel de Cargo - Categorizado',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Cargo y Liderazgo',
      icono: 'fas fa-sitemap',
      pagina: 'situacion-laboral'
    },
    {
      id: 'tiempo_cargo',
      titulo: 'Tiempo de permanencia en el cargo actual',
      column: 'Tiempo en el cargo:',
      tipo: 'single',
      chart: 'bar',
      familia: 'Cargo y Liderazgo',
      icono: 'fas fa-clock',
      pagina: 'situacion-laboral',
      orden: ['Menos de 1 año.', 'De 1 a 2 años.', 'De 2 a 5 años.', 'Más de 5 años']
    },
    {
      id: 'personal_cargo',
      titulo: '¿Tienes personal a tu cargo?',
      column: '¿Tienes personal a tu cargo?',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Cargo y Liderazgo',
      icono: 'fas fa-users-gear',
      pagina: 'situacion-laboral',
      orden: ['No.', 'Sí, menos de 10 personas.', 'Sí, de 10 a 20 personas.', 'Sí, más de 20 personas.']
    },
    {
      id: 'equipo_unw',
      titulo: '¿Tienes en tu equipo estudiantes o egresados de la UNW?',
      column: '¿Tienes actualmente en tu equipo estudiantes o egresados de la Universidad Norbert Wiener?',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Cargo y Liderazgo',
      icono: 'fas fa-people-group',
      pagina: 'situacion-laboral',
      orden: ['Sí', 'No', 'No especifica']
    },
    {
      id: 'ingreso_mensual',
      titulo: 'Ingreso mensual bruto aproximado',
      column: '¿Cuál es tu ingreso mensual bruto aproximado?',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Ingresos',
      icono: 'fas fa-money-bill-wave',
      pagina: 'situacion-laboral',
      orden: [
        'Menos de S/ 2,500',
        'S/ 2,501 – 4,000',
        'S/ 4,001 – 6,000',
        'S/ 6,001 – 8,000',
        'S/ 8,001 – 12,000',
        'Más de S/ 12,000',
        'Prefiero no indicarlo'
      ]
    },
    {
      id: 'sueldo_promedio',
      titulo: 'Sueldo mensual promedio estimado (S/)',
      column: 'Sueldo Promedio',
      tipo: 'numeric_avg',
      chart: 'bar',
      familia: 'Ingresos',
      icono: 'fas fa-coins',
      pagina: 'situacion-laboral'
    },
    {
      id: 'zona_geografica',
      titulo: 'Zona geográfica donde labora',
      column: 'Zona Geográfica de Trabajo',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Ubicación Laboral',
      icono: 'fas fa-map-location-dot',
      pagina: 'situacion-laboral'
    },
    {
      id: 'departamento',
      titulo: 'Departamento donde labora (Top 10)',
      column: 'Departamento',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Ubicación Laboral',
      icono: 'fas fa-location-dot',
      pagina: 'situacion-laboral',
      topN: 10
    },
    {
      id: 'provincia',
      titulo: 'Provincia donde labora (Top 10)',
      column: 'Provincia',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Ubicación Laboral',
      icono: 'fas fa-map-pin',
      pagina: 'situacion-laboral',
      topN: 10
    },
    {
      id: 'distrito',
      titulo: 'Distrito donde labora (Top 10)',
      column: 'Distrito dónde labora',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Ubicación Laboral',
      icono: 'fas fa-compass',
      pagina: 'situacion-laboral',
      topN: 10
    },
    {
      id: 'razon_no_trabaja',
      titulo: 'Si no trabaja, ¿cuál es la principal razón?',
      column: '¿Cuál es la principal razón por la que no se encuentra trabajando actualmente?',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Situación Laboral',
      icono: 'fas fa-user-clock',
      pagina: 'situacion-laboral'
    },
    {
      id: 'rango_edad',
      titulo: 'Distribución por rango de edad',
      column: 'Rango de Edad',
      tipo: 'single',
      chart: 'bar',
      familia: 'Perfil Demográfico',
      icono: 'fas fa-id-card',
      pagina: 'situacion-laboral',
      orden: ['22–25 años', '26–30 años', '31–35 años', '36–40 años', '41–50 años', '51 a más']
    },

    // --- Empleabilidad e Impacto del Programa ---
    {
      id: 'nivel_empleabilidad',
      titulo: 'Nivel de empleabilidad final (sobre PEA)',
      column: 'Nivel de Empleabilidad Final',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Empleabilidad',
      icono: 'fas fa-chart-line',
      pagina: 'empleabilidad',
      orden: ['Sí', 'No']
    },
    {
      id: 'aumento_ingreso',
      titulo: '¿Tu ingreso aumentó luego de culminar el programa de posgrado?',
      column: '¿Tu ingreso aumentó luego de culminar el programa de posgrado?',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Impacto Salarial y Mejoras',
      icono: 'fas fa-arrow-trend-up',
      pagina: 'empleabilidad',
      orden: [
        'Sí, aumentó significativamente (más del 30%).',
        'Sí, aumentó moderadamente (entre 10% y 30%)',
        'Sí, aumentó ligeramente (menos del 10%)',
        'No, se mantiene igual',
        'No, disminuyó',
        'No especifica'
      ]
    },
    {
      id: 'satisfaccion_trabajo',
      titulo: '¿Qué tan satisfecho te sientes con tu trabajo actual?',
      column: '¿Qué tan satisfecho te sientes con tu trabajo actual?',
      tipo: 'single',
      chart: 'bar',
      familia: 'Satisfacción y Contribución',
      icono: 'fas fa-face-smile',
      pagina: 'empleabilidad',
      orden: ['Muy satisfecho', 'Satisfecho', 'Insatisfecho', 'Muy insatisfecho', 'No especifica']
    },
    {
      id: 'mejoras_laborales',
      titulo: '¿Has tenido mejoras laborales luego de culminar el posgrado? (Múltiple)',
      column: '¿Has tenido mejoras laborales luego de culminar el programa de posgrado? (Puedes marcar más de una opción)',
      indicatorColumns: [
        'Ascenso o promoción laboral',
        'Incremento salarial',
        'Cambio a un empleo con mejores condiciones',
        'Mayor especialización o ampliación de funciones',
        'Aún no he tenido cambios laborales relevantes',
        'Inicio o fortalecimiento de emprendimiento propio'
      ],
      tipo: 'multi',
      chart: 'horizontal_bar',
      familia: 'Impacto Salarial y Mejoras',
      icono: 'fas fa-award',
      pagina: 'empleabilidad'
    },
    {
      id: 'tiempo_mejora',
      titulo: 'Tiempo tras el egreso en que se produjo la mejora laboral',
      column: 'Si marcaste alguna mejora laboral, ¿en cuánto tiempo después de culminar el programa de posgrado se produjo el cambio?',
      tipo: 'single',
      chart: 'bar',
      familia: 'Impacto Salarial y Mejoras',
      icono: 'fas fa-hourglass-half',
      pagina: 'empleabilidad',
      orden: [
        'Antes de culminar el programa de posgrado',
        'Entre 0 y 6 meses',
        'Entre 7 y 12 meses',
        'Entre 1 y 2 años',
        'Más de 2 años',
        'No especifica'
      ]
    },
    {
      id: 'contribucion_perfil',
      titulo: '¿En qué medida el posgrado contribuyó a mejorar tu perfil profesional?',
      column: '¿En qué medida consideras que el programa de posgrado contribuyó a mejorar tu perfil profesional?',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Satisfacción y Contribución',
      icono: 'fas fa-rocket',
      pagina: 'empleabilidad',
      orden: [
        'Contribuyó significativamente',
        'Contribuyó',
        'Contribuyó parcialmente',
        'Contribuyó muy poco',
        'No contribuyó',
        'No especifica'
      ]
    },
    {
      id: 'satisfaccion_formacion',
      titulo: 'Nivel de satisfacción con la formación recibida en el posgrado',
      column: '¿Cuál es tu nivel de satisfacción con la formación recibida en el programa de posgrado?',
      tipo: 'single',
      chart: 'bar',
      familia: 'Satisfacción y Contribución',
      icono: 'fas fa-thumbs-up',
      pagina: 'empleabilidad',
      orden: ['Muy satisfecho', 'Satisfecho', 'Insatisfecho', 'Muy insatisfecho', 'No especifica']
    },

    // --- Formación Continua y Red Alumni ---
    {
      id: 'motivacion_posgrado',
      titulo: 'Principal motivación para estudiar el programa de posgrado (Múltiple)',
      column: '¿Cuál fue tu principal motivación para estudiar el programa de posgrado? (Puedes escoger más de una opción)',
      indicatorColumns: [
        'Incrementar mis ingresos',
        'Acceder a mejores oportunidades laborales',
        'Especializarme en mi área profesional',
        'Cumplir con un requisito laboral o institucional',
        'Desarrollar nuevos conocimientos por interés académico',
        'Emprender o fortalecer mi negocio'
      ],
      tipo: 'multi',
      chart: 'horizontal_bar',
      familia: 'Motivación y Continuidad Académica',
      icono: 'fas fa-bullseye',
      pagina: 'formacion-continua'
    },
    {
      id: 'continuar_estudios',
      titulo: '¿Te interesa continuar estudios en la Universidad Norbert Wiener?',
      column: '¿Te interesa continuar estudios en la Universidad Norbert Wiener?',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Motivación y Continuidad Académica',
      icono: 'fas fa-graduation-cap',
      pagina: 'formacion-continua',
      orden: ['Sí', 'No']
    },
    {
      id: 'posgrado_interes',
      titulo: 'Posgrado de interés para continuar estudios (Categorizado)',
      column: 'En caso haya respondido que Sí, ¿en que posgrado estas interesado? - Categorizado',
      tipo: 'single',
      chart: 'bar',
      familia: 'Motivación y Continuidad Académica',
      icono: 'fas fa-book-open',
      pagina: 'formacion-continua',
      orden: ['Maestría', 'Segunda Especialidad', 'Doctorado', 'Diplomado', 'No especifica']
    },
    {
      id: 'red_egresados',
      titulo: '¿Te gustaría participar en actividades de la red de egresados Wiener?',
      column: '¿Te gustaría participar en actividades de la red de egresados Wiener? (Reencuentro de egresados, charlas como ponentes, campeonato alumni, etc.)',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Vinculación Alumni',
      icono: 'fas fa-handshake',
      pagina: 'formacion-continua',
      orden: ['Sí', 'No', 'No especifica']
    },
    {
      id: 'oportunidades_alumni',
      titulo: '¿Te gustaría recibir oportunidades laborales y actividades alumni?',
      column: '¿Te gustaría recibir oportunidades laborales y actividades alumni?',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Vinculación Alumni',
      icono: 'fas fa-envelope-open-text',
      pagina: 'formacion-continua',
      orden: ['Sí', 'No', 'No especifica']
    },

    // --- Recomendación (NPS) ---
    {
      id: 'segmento_nps',
      titulo: 'Segmento NPS (Recomendación de Posgrado UNW)',
      column: 'Segmento NPS',
      tipo: 'single',
      chart: 'doughnut',
      familia: 'Recomendación (NPS)',
      icono: 'fas fa-star',
      pagina: 'preguntas-abiertas',
      orden: ['Promotor', 'Neutral (pasivo)', 'Detractor', 'No especifica']
    },
    {
      id: 'calificacion_nps',
      titulo: 'Calificación de recomendación UNW (escala 0–10)',
      column: '¿Recomendarías estudiar un programa de posgrado de la UNW a familiares/amigos/conocidos?',
      tipo: 'single',
      chart: 'bar',
      familia: 'Recomendación (NPS)',
      icono: 'fas fa-ranking-star',
      pagina: 'preguntas-abiertas',
      orden: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'No especifica']
    },
    {
      id: 'razon_nps_cat',
      titulo: 'Principal razón de la calificación otorgada (Categorizado)',
      column: 'Razón de la Calificación Otorgada - Categorizado (Final)',
      tipo: 'single',
      chart: 'horizontal_bar',
      familia: 'Recomendación (NPS)',
      icono: 'fas fa-comments',
      pagina: 'preguntas-abiertas'
    }
  ],

  // Pregunta NPS (0-10) y columna de razón abierta.
  nps: {
    column: ['¿Recomendarías estudiar un programa de posgrado de la UNW a familiares/amigos/conocidos?'],
    segmentColumn: ['Segmento NPS'],
    reasonCategoryColumn: ['Razón de la Calificación Otorgada - Categorizado (Final)'],
    titulo: '¿Recomendarías estudiar un programa de posgrado de la UNW a familiares/amigos/conocidos?'
  },

  // Preguntas abiertas para la pestaña "NPS y Cualitativo".
  openQuestions: [
    {
      titulo: '¿Cuál es la principal razón de la calificación otorgada?',
      column: ['¿Cuál es la principal razón de la calificación otorgada?'],
      categoryColumn: ['Razón de la Calificación Otorgada - Categorizado (Final)'],
      segmentColumn: ['Segmento NPS']
    }
  ],

  // Paleta oficial de Posgrado según design.md: Negro (#000000) + Dorado Arena (#DCB17C) + neutros.
  chartColors: [
    '#000000',
    '#DCB17C',
    '#4B5563',
    '#9CA3AF',
    '#D1D5DB',
    '#27272A',
    '#B88B52',
    '#E5E7EB'
  ]
};
