import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import bcrypt from 'bcryptjs';
import { registrarMovimiento } from '../../../services/audit.service';

export const prerender = false;

const ALLOWED_FIELDS = ['nombre', 'correo', 'rol', 'activo'];

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

    if (body.password) {
      clean.password = await bcrypt.hash(body.password, 10);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(clean)
      .eq('id', params.id)
      .select('id, nombre, correo, rol, activo')
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'usuario_actualizado', `Usuario ${clean.nombre || params.id} actualizado`);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { data: usuario } = await supabase.from('usuarios').select('nombre').eq('id', params.id).single();

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', params.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    if (usuario) {
      registrarMovimiento({ cookies } as any, 'usuario_eliminado', `Usuario ${usuario.nombre} eliminado`);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
