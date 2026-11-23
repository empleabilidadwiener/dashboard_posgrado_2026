const Exports = {
  async exportChartToPNG(canvasId, filename) {
    if (window.Charts?.exportChartToPNG) {
      window.Charts.exportChartToPNG(canvasId, filename);
    }
  },

  async exportAllChartsToPNG() {
    const charts = document.querySelectorAll('canvas:not(#canvas-fullscreen-chart)');
    for (const chart of charts) {
      const id = chart.id;
      if (id) {
        await this.sleep(300);
        this.exportChartToPNG(id, `${id}.png`);
      }
    }
  },

  exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tr'));
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => {
        let text = cell.textContent.trim();
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(',');
    }).join('\n');

    this.downloadFile('\uFEFF' + csvContent, filename || `${tableId}.csv`, 'text/csv;charset=utf-8');
  },

  exportDataToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename || 'datos_posgrado_exportados.json', 'application/json');
  },

  exportFilteredData(rows, filename) {
    const data = rows || (window.App ? window.App.getFilteredData() : []);
    this.exportDataToJSON(data, filename || 'posgrado_2026_filtrado.json');
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

window.Exports = Exports;

