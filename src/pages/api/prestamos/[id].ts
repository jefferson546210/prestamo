import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';

export const prerender = false;

const ALLOWED_FIELDS = ['monto', 'interes', 'cuotas', 'fecha_inicio', 'fecha_fin', 'observaciones', 'estado'];

export const GET: APIRoute = async ({ params }) => {
  try {
    const { data, error } = await supabase
      .from('prestamos')
      .select(`*, clientes(nombre, apellido, cedula, telefono, correo)`)
      .eq('id', params.id)
      .single();

    if (error) return new Response(JSON.stringify({ error: 'Préstamo no encontrado' }), { status: 404 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
    }

    const clean: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) clean[field] = body[field];
    }

    if (clean.monto !== undefined) {
      const interesActual = clean.interes ?? (await getCurrentInteres(params.id!));
      clean.monto_total = Number(clean.monto) * (1 + Number(interesActual) / 100);
    }

    const { data, error } = await supabase
      .from('prestamos')
      .update(clean)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'prestamo_actualizado', `Préstamo ${params.id} actualizado`);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { data: prestamo } = await supabase.from('prestamos').select('monto').eq('id', params.id).single();

    const { error } = await supabase
      .from('prestamos')
      .delete()
      .eq('id', params.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    if (prestamo) {
      registrarMovimiento({ cookies } as any, 'prestamo_eliminado', `Préstamo RD$ ${prestamo.monto} eliminado`);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

async function getCurrentInteres(id: string): Promise<number> {
  const { data } = await supabase.from('prestamos').select('interes').eq('id', id).single();
  return data?.interes ?? 0;
}
