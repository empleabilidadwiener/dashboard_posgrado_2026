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
DEFAULT_XLSX = os.path.join(ROOT_DIR, 'data', 'Base de Datos_Estudio de Egresados_Posgrado_VF_2.xlsx')
OUT_CSV = os.path.join(ROOT_DIR, 'data', 'respuestas_posgrado_2026.csv')
OUT_JSON = os.path.join(ROOT_DIR, 'data', 'respuestas_posgrado_2026.json')


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


if __name__ == '__main__':
    main()
