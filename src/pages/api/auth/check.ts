import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';

export const GET: APIRoute = async ({ url }) => {
  const correo = url.searchParams.get('correo');

  if (!correo) {
    return new Response(JSON.stringify({ error: 'Parámetro "correo" requerido' }), { status: 400 });
  }

  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, activo')
    .ilike('correo', correo.toLowerCase().trim())
    .limit(1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!usuarios || usuarios.length === 0) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado', correo_buscado: correo }), { status: 404 });
  }

  const u = usuarios[0];
  return new Response(JSON.stringify({
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    activo: u.activo,
  }), { status: 200 });
};
