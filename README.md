# Dashboard de Empleabilidad de Posgrado 2026

Panel interactivo de resultados de la **Encuesta de Egresados de Posgrado 2026** (Dirección de Empleabilidad y Egresados — Universidad Norbert Wiener).

## Características principales

- **Identidad visual de Posgrado**: Paleta institucional negro (`#000000`) y acento arena dorado (`#DCB17C`) con contraste WCAG 2.1 AA.
- **Formato de datos nativo**: Conversión automática desde Excel a CSV y JSON mediante [`tools/transformar_datos.py`](tools/transformar_datos.py) (`640` registros en `data/respuestas_posgrado_2026.csv` y `data/respuestas_posgrado_2026.json`).
- **Resultados por pregunta y cruces**: `33` preguntas del instrumento con vista general y cruces por **Año de egreso**, **Tipo de programa (columna F)** y **Programa específico**.
- **Edición en vivo y exportación**: Modo de edición de textos (`data/custom_texts.json`) con sincronización opcional vía GitHub API y exportación en CSV/JSON/Excel.
- **Ficha técnica y representatividad**: Documentación del levantamiento de campo (`28.10 – 10.11.2026`), sustento metodológico y tablas de composición muestral.

## Ejecución local

```bash
python3 server.py
```

Luego abrir `http://127.0.0.1:8080`.

### Actualización de datos

Para regenerar `data/respuestas_posgrado_2026.csv` y `data/respuestas_posgrado_2026.json` desde la base Excel:

```bash
python3 tools/transformar_datos.py
```

## Configuración de GitHub Sync (opcional)

1. Copia `js/env.example.js` como `js/env.js` (este archivo está ignorado por `.gitignore` y **no debe subirse al repositorio**).
2. Configura tu token personal en `js/env.js` o desde el modal del botón **Editor** en la barra lateral.

## Publicación en GitHub (`empleabilidadwiener`)

```bash
git remote add origin git@github-wiener:empleabilidadwiener/dashboard_posgrado_2026.git
git push -u origin main
```

En GitHub, activar **Settings → Pages → Deploy from a branch (`main` / `/root`)**.

