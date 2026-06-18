import { supabase } from '../db/supabase';
import PDFDocument from 'pdfkit';

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
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  const fecha = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
  const pageWidth = doc.page.width - 80;

  // Header
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2563eb').text(nombreEmpresa, 40, 40, { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Reporte Financiero — ${fecha}`, { align: 'center' });
  doc.moveTo(40, 75).lineTo(40 + pageWidth, 75).strokeColor('#2563eb').stroke();
  doc.moveDown(2);

  // KPIs
  const kpis = [
    { label: 'Total Prestado', value: `RD$ ${totalPrestado.toLocaleString()}`, color: '#2563eb' },
    { label: 'Total Cobrado', value: `RD$ ${totalCobrado.toLocaleString()}`, color: '#16a34a' },
    { label: 'Saldo Pendiente', value: `RD$ ${saldoPendiente.toLocaleString()}`, color: '#dc2626' },
    { label: 'Tasa Recuperación', value: `${tasaRecuperacion}%`, color: '#9333ea' },
  ];
  const kpiW = (pageWidth - 16) / 4;
  kpis.forEach((k, i) => {
    const x = 40 + i * (kpiW + 5);
    doc.roundedRect(x, doc.y, kpiW, 52, 6).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(k.label, x + 8, doc.y - 46, { width: kpiW - 16, align: 'center' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor(k.color).text(k.value, x + 8, doc.y - 30, { width: kpiW - 16, align: 'center' });
    doc.y = doc.y - 38;
  });
  doc.moveDown(2);

  // Second row KPIs
  const kpis2 = [
    { label: 'Préstamos Activos', value: String(prestamosActivos), color: '#2563eb' },
    { label: 'Préstamos Pagados', value: String(prestamosPagados), color: '#16a34a' },
    { label: 'Préstamos Vencidos', value: String(prestamosVencidos), color: '#dc2626' },
    { label: 'Total Clientes', value: String(totalClientes), color: '#9333ea' },
  ];
  kpis2.forEach((k, i) => {
    const x = 40 + i * (kpiW + 5);
    doc.roundedRect(x, doc.y, kpiW, 52, 6).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(k.label, x + 8, doc.y - 46, { width: kpiW - 16, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(k.color).text(k.value, x + 8, doc.y - 32, { width: kpiW - 16, align: 'center' });
    doc.y = doc.y - 38;
  });
  doc.moveDown(2);

  // Portfolio state
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Estado de Cartera');
  doc.moveDown(0.5);
  const estados = [
    { label: 'Activos', count: prestamosActivos, color: '#2563eb' },
    { label: 'Pagados', count: prestamosPagados, color: '#16a34a' },
    { label: 'Vencidos', count: prestamosVencidos, color: '#dc2626' },
  ];
  estados.forEach(e => {
    const pct = totalPrestamos > 0 ? Math.round((e.count / totalPrestamos) * 100) : 0;
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`${e.label}  ${pct}% (${e.count})`, 40, doc.y, { continued: true });
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`     Tasa de mora: ${tasaMora}%     Recuperación: ${tasaRecuperacion}%`, 40, doc.y - 10, { align: 'right', width: pageWidth });
    doc.roundedRect(40, doc.y + 2, pageWidth, 8, 4).fill('#f1f5f9');
    doc.roundedRect(40, doc.y + 2, pageWidth * (pct / 100), 8, 4).fill(e.color);
    doc.moveDown(1.5);
  });
  doc.moveDown(1);

  // Recent payments
  if (ultimosPagos.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Últimos Pagos');
    doc.moveDown(0.5);
    // Table header
    doc.roundedRect(40, doc.y, pageWidth, 18, 4).fill('#f8fafc');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('Fecha', 48, doc.y - 14, { width: 100 });
    doc.text('Método', 148, doc.y - 14, { width: 100 });
    doc.text('Monto', pageWidth - 40, doc.y - 14, { width: 80, align: 'right' });
    doc.moveDown(0.2);
    ultimosPagos.forEach((p, i) => {
      const y = doc.y;
      doc.fontSize(8).font('Helvetica').fillColor('#0f172a');
      doc.text(new Date(p.fecha_pago).toLocaleDateString('es-DO'), 48, y, { width: 100 });
      doc.fillColor('#64748b').text(p.metodo_pago || '—', 148, y, { width: 100 });
      doc.fillColor('#16a34a').font('Helvetica-Bold').text(`RD$ ${p.monto_pagado.toLocaleString()}`, pageWidth - 40, y, { width: 80, align: 'right' });
      if (i < ultimosPagos.length - 1) {
        doc.moveTo(40, doc.y + 8).lineTo(40 + pageWidth, doc.y + 8).strokeColor('#f1f5f9').stroke();
      }
      doc.moveDown(0.3);
    });
  }
  doc.moveDown(1);

  // Overdue loans
  if (prestamosVencidosLista.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626').text('Préstamos Vencidos');
    doc.moveDown(0.5);
    doc.roundedRect(40, doc.y, pageWidth, 18, 4).fill('#fff5f5');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('Cliente', 48, doc.y - 14, { width: 150 });
    doc.text('Monto', 200, doc.y - 14, { width: 80 });
    doc.text('Saldo', 280, doc.y - 14, { width: 80 });
    doc.text('Vencido', pageWidth - 40, doc.y - 14, { width: 80, align: 'right' });
    doc.moveDown(0.2);
    prestamosVencidosLista.forEach((p, i) => {
      const y = doc.y;
      const cliente = p.clientes ? `${p.clientes.nombre} ${p.clientes.apellido}` : '—';
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text(cliente, 48, y, { width: 150 });
      doc.font('Helvetica').fillColor('#475569').text(`RD$ ${p.monto.toLocaleString()}`, 200, y, { width: 80 });
      doc.font('Helvetica-Bold').fillColor('#dc2626').text(`RD$ ${p.saldo_restante.toLocaleString()}`, 280, y, { width: 80 });
      doc.font('Helvetica').fillColor('#dc2626').text(
        p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString('es-DO') : '—',
        pageWidth - 40, y, { width: 80, align: 'right' }
      );
      if (i < prestamosVencidosLista.length - 1) {
        doc.moveTo(40, doc.y + 8).lineTo(40 + pageWidth, doc.y + 8).strokeColor('#f1f5f9').stroke();
      }
      doc.moveDown(0.3);
    });
  }

  // Footer
  const totalP = doc.y;
  if (totalP > 650) { doc.addPage(); }
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
    .text('Generado por Sistema de Préstamos', 40, doc.page.height - 40, { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}
