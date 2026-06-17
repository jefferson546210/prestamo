import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    const prestamoId = url.searchParams.get('prestamo_id');
    if (!prestamoId) {
      return new Response(JSON.stringify({ error: 'prestamo_id es requerido' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', prestamoId)
      .order('numero_cuota', { ascending: true });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const hoy = new Date().toISOString().split('T')[0];
    const cuotas = (data || []).map(c => ({
      ...c,
      estado_actual: c.estado === 'pendiente' && c.fecha_vencimiento < hoy ? 'vencido' : c.estado,
    }));

    return new Response(JSON.stringify(cuotas), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
