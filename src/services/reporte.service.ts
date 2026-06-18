import { supabase } from '../db/supabase';
import PDFDocument from 'pdfkit';

function drawKpiCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string, value: string, color: string) {
  const h = 54;
  doc.roundedRect(x, y, w, h, 6).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(label, x, y + 8, { width: w, align: 'center' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(color).text(value, x, y + 24, { width: w, align: 'center' });
}

function drawTableHeader(doc: PDFKit.PDFDocument, x: number, y: number, w: number, columns: { label: string; x: number; w: number; align?: string }[]) {
  const h = 20;
  doc.roundedRect(x, y, w, h, 4).fill('#f8fafc');
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
  columns.forEach(col => {
    doc.text(col.label, col.x, y + 5, { width: col.w, align: (col.align || 'left') as 'left' | 'center' | 'right' });
  });
}

function drawTableRow(doc: PDFKit.PDFDocument, x: number, y: number, w: number, columns: { text: string; x: number; w: number; color?: string; bold?: boolean; align?: string }[], isLast: boolean) {
  columns.forEach(col => {
    const f = col.bold ? 'Helvetica-Bold' : 'Helvetica';
    doc.fontSize(8).font(f).fillColor(col.color || '#0f172a');
    doc.text(col.text, col.x, y + 2, { width: col.w, align: (col.align || 'left') as 'left' | 'center' | 'right' });
  });
  if (!isLast) {
    doc.moveTo(x, y + 16).lineTo(x + w, y + 16).strokeColor('#f1f5f9').stroke();
  }
}

function addFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
    .text(`Generado por Sistema de Préstamos — Página ${pageNum}`, 40, doc.page.height - 40, { align: 'center' });
}

export async function generarPDFReporte(): Promise<Buffer> {
  const [prestamosRes, pagosRes, clientesRes, configRes] = await Promise.all([
    supabase.from('prestamos').select('*, clientes(nombre, apellido)'),
    supabase.from('pagos').select('*').order('fecha_pago', { ascending: false }),
    supabase.from('clientes').select('*'),
    supabase.from('configuracion').select('nombre_empresa').single(),
  ]);

  const prestamos = prestamosRes.data || [];
  const pagos = pagosRes.data || [];
  const totalClientes = clientesRes.data?.length ?? 0;
  const nombreEmpresa = configRes.data?.nombre_empresa || 'Sistema de Préstamos';

  const totalPrestado = prestamos.reduce((s, p) => s + p.monto, 0);
  const totalCobrado = pagos.reduce((s, p) => s + p.monto_pagado, 0);
  const saldoPendiente = prestamos.reduce((s, p) => s + p.saldo_restante, 0);
  const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;
  const prestamosPagados = prestamos.filter(p => p.estado === 'pagado').length;
  const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido').length;
  const totalPrestamos = prestamos.length;
  const tasaRecuperacion = totalPrestado > 0 ? ((totalCobrado / totalPrestado) * 100).toFixed(1) : '0';
  const tasaMora = totalPrestamos > 0 ? ((prestamosVencidos / totalPrestamos) * 100).toFixed(1) : '0';
  const ultimosPagos = pagos.slice(0, 8);
  const prestamosVencidosLista = prestamos.filter(p => p.estado === 'vencido');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', chunk => buffers.push(chunk));

  const fecha = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
  const ML = 40;
  const PW = doc.page.width - ML * 2;
  const cardW = (PW - 30) / 4;
  const gap = 10;
  let pageNum = 1;

  // === HEADER ===
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2563eb').text(nombreEmpresa, ML, 40, { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Reporte Financiero — ${fecha}`, { align: 'center' });
  doc.moveTo(ML, 74).lineTo(ML + PW, 74).strokeColor('#2563eb').stroke();

  let y = 88;

  // === RESUMEN EJECUTIVO ===
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Resumen Ejecutivo', ML, y);
  y += 22;

  // Row 1
  const kpi1 = [
    { label: 'Total Prestado', value: `RD$ ${totalPrestado.toLocaleString()}`, color: '#2563eb' },
    { label: 'Total Cobrado', value: `RD$ ${totalCobrado.toLocaleString()}`, color: '#16a34a' },
    { label: 'Saldo Pendiente', value: `RD$ ${saldoPendiente.toLocaleString()}`, color: '#dc2626' },
    { label: 'Tasa Recuperación', value: `${tasaRecuperacion}%`, color: '#9333ea' },
  ];
  kpi1.forEach((k, i) => drawKpiCard(doc, ML + i * (cardW + gap), y, cardW, k.label, k.value, k.color));
  y += 58;

  // Row 2
  const kpi2 = [
    { label: 'Préstamos Activos', value: String(prestamosActivos), color: '#2563eb' },
    { label: 'Préstamos Pagados', value: String(prestamosPagados), color: '#16a34a' },
    { label: 'Préstamos Vencidos', value: String(prestamosVencidos), color: '#dc2626' },
    { label: 'Total Clientes', value: String(totalClientes), color: '#9333ea' },
  ];
  kpi2.forEach((k, i) => drawKpiCard(doc, ML + i * (cardW + gap), y, cardW, k.label, k.value, k.color));
  y += 60;

  // === ESTADO DE CARTERA ===
  if (y > 650) { doc.addPage(); pageNum++; y = 40; }
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Estado de Cartera', ML, y);
  y += 22;

  const estados = [
    { label: 'Activos', count: prestamosActivos, color: '#2563eb' },
    { label: 'Pagados', count: prestamosPagados, color: '#16a34a' },
    { label: 'Vencidos', count: prestamosVencidos, color: '#dc2626' },
  ];
  estados.forEach(e => {
    const pct = totalPrestamos > 0 ? Math.round((e.count / totalPrestamos) * 100) : 0;
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`${e.label}  ${pct}% (${e.count})`, ML, y);
    y += 14;
    doc.roundedRect(ML, y, PW, 8, 4).fill('#f1f5f9');
    if (pct > 0) doc.roundedRect(ML, y, PW * (pct / 100), 8, 4).fill(e.color);
    y += 14;
  });

  // Summary line (once, after all bars)
  doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Tasa de mora: ${tasaMora}%     |     Tasa de recuperación: ${tasaRecuperacion}%`, ML, y);
  y += 22;

  // === ÚLTIMOS PAGOS ===
  if (ultimosPagos.length > 0) {
    if (y > 650) { doc.addPage(); pageNum++; y = 40; }
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Últimos Pagos', ML, y);
    y += 22;

    const cW = Math.floor(PW / 3);
    const colFecha = ML;
    const colMetodo = ML + cW;
    const colMonto = ML + cW * 2;
    drawTableHeader(doc, ML, y, PW, [
      { label: 'Fecha', x: colFecha, w: cW - 5 },
      { label: 'Método', x: colMetodo, w: cW - 5 },
      { label: 'Monto', x: colMonto, w: cW - 5, align: 'right' },
    ]);
    y += 22;

    ultimosPagos.forEach((p, i) => {
      if (y > 730) { doc.addPage(); pageNum++; y = 40; }
      const isLast = i === ultimosPagos.length - 1;
      drawTableRow(doc, ML, y, PW, [
        { text: new Date(p.fecha_pago).toLocaleDateString('es-DO'), x: colFecha, w: cW - 5 },
        { text: p.metodo_pago || '—', x: colMetodo, w: cW - 5, color: '#64748b' },
        { text: `RD$ ${p.monto_pagado.toLocaleString()}`, x: colMonto, w: cW - 5, color: '#16a34a', bold: true, align: 'right' },
      ], isLast);
      y += 18;
    });
    y += 10;
  }

  // === PRÉSTAMOS VENCIDOS ===
  if (prestamosVencidosLista.length > 0) {
    if (y > 600) { doc.addPage(); pageNum++; y = 40; }
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('Préstamos Vencidos', ML, y);
    y += 22;

    const cW2 = Math.floor(PW / 4);
    const colCli = ML;
    const colMon = ML + cW2;
    const colSal = ML + cW2 * 2;
    const colVen = ML + cW2 * 3;
    drawTableHeader(doc, ML, y, PW, [
      { label: 'Cliente', x: colCli, w: cW2 - 5 },
      { label: 'Monto', x: colMon, w: cW2 - 5 },
      { label: 'Saldo', x: colSal, w: cW2 - 5 },
      { label: 'Vencido', x: colVen, w: cW2 - 5, align: 'right' },
    ]);
    y += 22;

    prestamosVencidosLista.forEach((p, i) => {
      if (y > 730) { doc.addPage(); pageNum++; y = 40; }
      const isLast = i === prestamosVencidosLista.length - 1;
      const cliente = p.clientes ? `${p.clientes.nombre} ${p.clientes.apellido}` : '—';
      drawTableRow(doc, ML, y, PW, [
        { text: cliente, x: colCli, w: cW2 - 5, bold: true },
        { text: `RD$ ${p.monto.toLocaleString()}`, x: colMon, w: cW2 - 5, color: '#475569' },
        { text: `RD$ ${p.saldo_restante.toLocaleString()}`, x: colSal, w: cW2 - 5, color: '#dc2626', bold: true },
        { text: p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString('es-DO') : '—', x: colVen, w: cW2 - 5, color: '#dc2626', align: 'right' },
      ], isLast);
      y += 18;
    });
  }

  // === FOOTER ===
  addFooter(doc, pageNum);

  doc.end();

  return new Promise(resolve => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}
