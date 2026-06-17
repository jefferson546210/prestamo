import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { data: existing, error: checkErr } = await supabase.from('usuarios').select('id').limit(1);
    if (checkErr) {
      return new Response(JSON.stringify({ error: 'Error chequeando usuarios: ' + checkErr.message, code: checkErr.code }), { status: 500 });
    }
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe un usuario. Usa el login normal.' }), { status: 400 });
    }

    const body = await request.json();

    if (!body.nombre || !body.correo || !body.password || !body.rol) {
      return new Response(JSON.stringify({ error: 'Faltan campos: nombre, correo, password, rol' }), { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        nombre: body.nombre,
        correo: body.correo.toLowerCase().trim(),
        password: passwordHash,
        rol: body.rol,
        activo: true,
      }])
      .select('id, nombre, correo, rol, activo')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Error al insertar: ' + error.message, details: error.details, hint: error.hint, code: error.code }), { status: 500 });
    }

    return new Response(JSON.stringify({ mensaje: 'Usuario creado exitosamente', usuario: data }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno: ' + (err instanceof Error ? err.message : String(err)) }), { status: 500 });
  }
};
