import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';
import { generarCuotas } from '../../../services/cuotas.service';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('prestamos')
      .select(`*, clientes(nombre, apellido, cedula, telefono)`)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

const ALLOWED_FIELDS = ['cliente_id', 'monto', 'interes', 'cuotas', 'fecha_inicio', 'fecha_fin', 'observaciones'];

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body inválido o vacío' }), { status: 400 });
    }

    if (!body.cliente_id || body.monto === undefined || body.interes === undefined || !body.cuotas) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
    }

    const clean: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) clean[field] = body[field];
    }

    const monto_total = Number(clean.monto) * (1 + Number(clean.interes) / 100);

    const { data, error } = await supabase
      .from('prestamos')
      .insert([{
        ...clean,
        monto_total,
        saldo_restante: monto_total,
        estado: 'activo',
      }])
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const fechaInicio = body.fecha_inicio || new Date().toISOString().split('T')[0];
    await generarCuotas(data.id, monto_total, Number(clean.cuotas), fechaInicio);

    registrarMovimiento({ cookies } as any, 'prestamo_creado', `Préstamo RD$ ${body.monto} creado (${body.cuotas} cuotas)`);

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
