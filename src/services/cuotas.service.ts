import { supabase } from '../db/supabase';

export async function generarCuotas(
  prestamoId: string,
  montoTotal: number,
  numCuotas: number,
  fechaInicio: string,
) {
  const cuotaBase = Math.floor((montoTotal / numCuotas) * 100) / 100;
  const ajuste = Math.round((montoTotal - cuotaBase * numCuotas) * 100) / 100;

  const inicio = new Date(fechaInicio);
  const cuotas = [];

  for (let i = 0; i < numCuotas; i++) {
    const vencimiento = new Date(inicio);
    vencimiento.setMonth(vencimiento.getMonth() + i + 1);

    const monto = i === numCuotas - 1
      ? Math.round((cuotaBase + ajuste) * 100) / 100
      : cuotaBase;

    cuotas.push({
      prestamo_id: prestamoId,
      numero_cuota: i + 1,
      monto,
      fecha_vencimiento: vencimiento.toISOString().split('T')[0],
      estado: 'pendiente',
    });
  }

  if (cuotas.length > 0) {
    const { error } = await supabase.from('cuotas').insert(cuotas);
    if (error) console.error('[CUOTAS] Error generando cuotas:', error);
  }
}

export async function obtenerCuotas(prestamoId: string) {
  const { data, error } = await supabase
    .from('cuotas')
    .select('*')
    .eq('prestamo_id', prestamoId)
    .order('numero_cuota', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function obtenerCuotasPendientes(prestamoId: string) {
  const { data, error } = await supabase
    .from('cuotas')
    .select('*')
    .eq('prestamo_id', prestamoId)
    .eq('estado', 'pendiente')
    .order('numero_cuota', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function marcarCuotaPagada(cuotaId: string, fechaPago: string) {
  const { error } = await supabase
    .from('cuotas')
    .update({ estado: 'pagado', fecha_pago: fechaPago })
    .eq('id', cuotaId);

  if (error) console.error('[CUOTAS] Error marcando cuota pagada:', error);
}

export async function revertirCuota(cuotaId: string) {
  const { error } = await supabase
    .from('cuotas')
    .update({ estado: 'pendiente', fecha_pago: null })
    .eq('id', cuotaId);

  if (error) console.error('[CUOTAS] Error revirtiendo cuota:', error);
}
