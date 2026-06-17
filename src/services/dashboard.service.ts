import { supabase } from '../db/supabase';

export interface EstadisticasDashboard {
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosPagados: number;
  prestamosVencidos: number;
  totalClientes: number;
  totalPrestado: number;
  totalCobrado: number;
  saldoPendiente: number;
  tasaCumplimiento: number;
  tasaMora: number;
  totalPrestamosCount: number;
  nuevosClientesMes: number;
  proximosVencimientos: Array<{
    id: string;
    cliente: string;
    monto: number;
    diasRestantes: number;
  }>;
  pagosPorMes: Array<{ mes: string; total: number }>;
  prestamosPorEstado: Array<{ estado: string; count: number; color: string }>;
}

export async function obtenerEstadisticasDashboard(): Promise<EstadisticasDashboard> {
  const [prestamosRes, pagosRes, clientesRes] = await Promise.all([
    supabase.from('prestamos').select('*'),
    supabase.from('pagos').select('*'),
    supabase.from('clientes').select('*'),
  ]);

  const prestamos = prestamosRes.data || [];
  const pagos = pagosRes.data || [];
  const clientes = clientesRes.data || [];

  const totalPrestado = prestamos.reduce((s, p) => s + p.monto, 0);
  const totalCobrado = pagos.reduce((s, p) => s + p.monto_pagado, 0);
  const saldoPendiente = prestamos.reduce((s, p) => s + p.saldo_restante, 0);
  const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;
  const prestamosPagados = prestamos.filter(p => p.estado === 'pagado').length;
  const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido').length;
  const totalPrestamosCount = prestamos.length;

  const tasaCumplimiento = totalPrestamosCount > 0
    ? Math.round((prestamosPagados / totalPrestamosCount) * 100)
    : 0;
  const tasaMora = totalPrestamosCount > 0
    ? Math.round((prestamosVencidos / totalPrestamosCount) * 100)
    : 0;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const nuevosClientesMes = clientes.filter(c =>
    new Date(c.created_at) >= inicioMes
  ).length;

  const hoy = new Date();
  const proximosVencimientos = prestamos
    .filter(p => p.estado === 'activo' && p.fecha_fin)
    .map(p => {
      const cliente = clientes.find(c => c.id === p.cliente_id);
      const dias = Math.ceil((new Date(p.fecha_fin).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : '—',
        monto: p.monto,
        diasRestantes: dias,
      };
    })
    .filter(p => p.diasRestantes > 0 && p.diasRestantes <= 30)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, 5);

  const meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const pagosPorMes = meses.map(mes => {
    const total = pagos
      .filter(p => p.fecha_pago && p.fecha_pago.startsWith(mes))
      .reduce((s, p) => s + p.monto_pagado, 0);
    const [y, m] = mes.split('-');
    const nombreMes = new Date(Number(y), Number(m) - 1).toLocaleDateString('es-DO', { month: 'short' });
    return { mes: nombreMes, total };
  });

  const prestamosPorEstado = [
    { estado: 'Activos',  count: prestamosActivos,  color: '#2563eb' },
    { estado: 'Pagados',  count: prestamosPagados,  color: '#16a34a' },
    { estado: 'Vencidos', count: prestamosVencidos, color: '#dc2626' },
  ].filter(e => e.count > 0);

  return {
    totalPrestado,
    prestamosActivos,
    prestamosPagados,
    prestamosVencidos,
    totalClientes: clientes.length,
    totalPrestamosCount,
    totalCobrado,
    saldoPendiente,
    tasaCumplimiento,
    tasaMora,
    nuevosClientesMes,
    proximosVencimientos,
    pagosPorMes,
    prestamosPorEstado,
  };
}
