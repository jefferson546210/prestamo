import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import bcrypt from 'bcryptjs';
import { registrarMovimiento } from '../../../services/audit.service';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, rol, activo, created_at')
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

const ALLOWED_FIELDS = ['nombre', 'correo', 'rol'];

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
    }

    if (!body.nombre || !body.correo || !body.password || !body.rol) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: nombre, correo, password, rol' }), { status: 400 });
    }

    const rolesValidos = ['admin', 'gestor', 'cajero'];
    if (!rolesValidos.includes(body.rol)) {
      return new Response(JSON.stringify({ error: 'Rol inválido. Use: admin, gestor, cajero' }), { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const clean: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) clean[field] = body[field];
    }
    clean.password = passwordHash;
    clean.activo = true;

    const { data, error } = await supabase
      .from('usuarios')
      .insert([clean])
      .select('id, nombre, correo, rol, activo')
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'usuario_creado', `Usuario ${body.nombre} (${body.rol}) creado`);

    return new Response(JSON.stringify(data), { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
