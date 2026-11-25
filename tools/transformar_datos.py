#!/usr/bin/env python3
"""
transformar_datos.py — Convierte y sincroniza la base de datos de Posgrado 2026
entre el Excel original, un CSV limpio UTF-8 (editable) y un JSON nativo para el dashboard.

Uso:
  python3 tools/transformar_datos.py                  # Lee el Excel original y genera CSV + JSON
  python3 tools/transformar_datos.py --source csv     # Regenera el JSON desde el CSV editado
  python3 tools/transformar_datos.py --input ruta.xlsx
"""
import argparse
import csv
import json
import os
import re
import openpyxl

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_XLSX = os.path.join(ROOT_DIR, 'data', 'Base de Datos_Estudio de Egresados_Posgrado_V4_corregido.xlsx')
DEFAULT_UNIV_XLSX = os.path.join(ROOT_DIR, 'data', 'Universo_Estudio de Empleabilidad Posgrado.xlsx')
OUT_CSV = os.path.join(ROOT_DIR, 'data', 'respuestas_posgrado_2026.csv')
OUT_JSON = os.path.join(ROOT_DIR, 'data', 'respuestas_posgrado_2026.json')
OUT_UNIV_JSON = os.path.join(ROOT_DIR, 'data', 'universo_posgrado_2026.json')


def clean_header(value):
    text = str(value or '').replace('\u0000', '').replace('_x0000_', '')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def clean_cell(value):
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'Sí' if value else 'No'
    if isinstance(value, (int, float)):
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)
    text = str(value).replace('\u0000', '').replace('_x0000_', '').strip()
    return text


def read_from_xlsx(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    headers = [clean_header(ws.cell(1, c).value) for c in range(1, ws.max_column + 1)]
    rows = []
    for r in range(2, ws.max_row + 1):
        row_obj = {}
        has_content = False
        for c_idx, header in enumerate(headers, start=1):
            if not header:
                continue
            val = clean_cell(ws.cell(r, c_idx).value)
            if val != '':
                has_content = True
            row_obj[header] = val
        if has_content:
            rows.append(row_obj)
    return [h for h in headers if h], rows


def read_from_csv(path):
    with open(path, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        headers = [clean_header(h) for h in (reader.fieldnames or []) if clean_header(h)]
        rows = []
        for raw_row in reader:
            row_obj = {}
            has_content = False
            for k, v in raw_row.items():
                hk = clean_header(k)
                if not hk:
                    continue
                val = clean_cell(v)
                if val != '':
                    has_content = True
                row_obj[hk] = val
            if has_content:
                rows.append(row_obj)
    return headers, rows


def write_csv(path, headers, rows):
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for row in rows:
            writer.writerow({h: row.get(h, '') for h in headers})


def write_json(path, headers, rows):
    payload = {
        'version': '2026-posgrado-1.0',
        'totalRows': len(rows),
        'columns': headers,
        'rows': rows
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))


def transform_universe(xlsx_path, out_json_path):
    if not os.path.exists(xlsx_path):
        return None
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sheet_name = 'Base de Datos' if 'Base de Datos' in wb.sheetnames else wb.sheetnames[0]
    ws = wb[sheet_name]

    rows_iter = ws.iter_rows(values_only=True)
    raw_headers = next(rows_iter, None)
    if not raw_headers:
        return None
    headers = [clean_header(h) for h in raw_headers]
    idx_prog = headers.index('Programa') if 'Programa' in headers else -1
    idx_carr = headers.index('nombre_carrera') if 'nombre_carrera' in headers else -1
    idx_anio = headers.index('anio_consultado') if 'anio_consultado' in headers else -1
    idx_sexo = headers.index('sexo') if 'sexo' in headers else -1
    idx_mod = headers.index('modalidad') if 'modalidad' in headers else -1

    cell_counts = {}
    by_tipo = {}
    by_anio = {}
    by_programa = {}
    total = 0

    for row in rows_iter:
        if not row:
            continue
        tipo = clean_cell(row[idx_prog]) if idx_prog >= 0 and idx_prog < len(row) else ''
        carrera = clean_header(clean_cell(row[idx_carr])) if idx_carr >= 0 and idx_carr < len(row) else ''
        anio = clean_cell(row[idx_anio]) if idx_anio >= 0 and idx_anio < len(row) else ''
        sexo = clean_cell(row[idx_sexo]) if idx_sexo >= 0 and idx_sexo < len(row) else ''
        if not tipo and not carrera:
            continue
        total += 1
        key = (anio, tipo, carrera, sexo)
        cell_counts[key] = cell_counts.get(key, 0) + 1

        if tipo:
            t_entry = by_tipo.setdefault(tipo, {'total': 0, 'c2325': 0, 'c2326': 0})
            t_entry['total'] += 1
            if anio in ('2023', '2024', '2025'):
                t_entry['c2325'] += 1
            if anio in ('2023', '2024', '2025', '2026'):
                t_entry['c2326'] += 1

        if anio:
            by_anio[anio] = by_anio.get(anio, 0) + 1

        if carrera:
            p_entry = by_programa.setdefault(carrera, {'programa': carrera, 'tipo': tipo, 'total': 0, 'c2325': 0, 'c2326': 0})
            p_entry['total'] += 1
            if anio in ('2023', '2024', '2025'):
                p_entry['c2325'] += 1
            if anio in ('2023', '2024', '2025', '2026'):
                p_entry['c2326'] += 1

    wb.close()

    cells = [
        {'a': k[0], 't': k[1], 'p': k[2], 's': k[3], 'n': count}
        for k, count in sorted(cell_counts.items(), key=lambda x: (-x[1], x[0]))
    ]
    payload = {
        'version': '2026-posgrado-universo-1.0',
        'sourceFile': os.path.basename(xlsx_path),
        'totalRows': total,
        'byTipo': by_tipo,
        'byAnio': dict(sorted(by_anio.items())),
        'byPrograma': sorted(by_programa.values(), key=lambda x: (-x['total'], x['programa'])),
        'cells': cells
    }
    with open(out_json_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
    return payload


def main():
    parser = argparse.ArgumentParser(description='Transforma y sincroniza datos de Posgrado a CSV y JSON nativo.')
    parser.add_argument('--source', choices=['xlsx', 'csv'], default='xlsx', help='Fuente de entrada (xlsx o csv)')
    parser.add_argument('--input', default=None, help='Ruta opcional al archivo de entrada')
    args = parser.parse_args()

    if args.source == 'csv':
        in_path = args.input or OUT_CSV
        headers, rows = read_from_csv(in_path)
    else:
        in_path = args.input or DEFAULT_XLSX
        headers, rows = read_from_xlsx(in_path)
        write_csv(OUT_CSV, headers, rows)

    write_json(OUT_JSON, headers, rows)
    print(f'Origen: {in_path}')
    print(f'Registros: {len(rows)} | Columnas: {len(headers)}')
    if args.source == 'xlsx':
        print(f'CSV generado:  {OUT_CSV}')
    print(f'JSON generado: {OUT_JSON}')

    univ = transform_universe(DEFAULT_UNIV_XLSX, OUT_UNIV_JSON)
    if univ:
        print(f'Universo generado: {OUT_UNIV_JSON} ({univ["totalRows"]} egresados, {len(univ["byPrograma"])} programas)')


if __name__ == '__main__':
    main()
