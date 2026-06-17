import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

const ALLOWED_FIELDS = ['nombre', 'apellido', 'cedula', 'telefono', 'correo', 'direccion'];

export const POST: APIRoute = async ({ request, cookies }) => {
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
    clean.activo = true;

    const { data, error } = await supabase
      .from('clientes')
      .insert([clean])
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'cliente_creado', `Cliente ${body.nombre} ${body.apellido} creado`);

    return new Response(JSON.stringify(data), { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
