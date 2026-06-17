import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';

export const prerender = false;

const ALLOWED_FIELDS = ['nombre', 'apellido', 'cedula', 'telefono', 'correo', 'direccion'];

export const GET: APIRoute = async ({ params }) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), { status: 404 });
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

    if (!body.nombre || !body.apellido || !body.cedula || !body.telefono) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: nombre, apellido, cedula, telefono' }), { status: 400 });
    }

    const clean: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) clean[field] = body[field];
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(clean)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'cliente_actualizado', `Cliente ${body.nombre} ${body.apellido} actualizado`);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { data: cliente } = await supabase.from('clientes').select('nombre, apellido').eq('id', params.id).single();

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', params.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    if (cliente) {
      registrarMovimiento({ cookies } as any, 'cliente_eliminado', `Cliente ${cliente.nombre} ${cliente.apellido} eliminado`);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
