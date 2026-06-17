import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return new Response(JSON.stringify({ error: 'Correo y contraseña requeridos' }), { status: 400 });
    }

    const correoNormalizado = correo.toLowerCase().trim();
    const passwordNormalizada = password.trim();

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('correo', correoNormalizado)
      .limit(1);

    if (error || !usuarios || usuarios.length === 0) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 });
    }

    const usuario = usuarios[0];

    if (!usuario.activo) {
      return new Response(JSON.stringify({ error: 'Usuario inactivo' }), { status: 401 });
    }

    let passwordValida = false;

    if (usuario.password && usuario.password.startsWith('$2')) {
      passwordValida = await bcrypt.compare(passwordNormalizada, usuario.password);
    } else {
      passwordValida = passwordNormalizada === usuario.password;
    }

    if (!passwordValida) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 });
    }

    const isProd = import.meta.env.PROD;
    const cookieOpts = {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    cookies.set('user_id', usuario.id, cookieOpts);
    cookies.set('user_rol', usuario.rol, cookieOpts);
    cookies.set('user_nombre', usuario.nombre, cookieOpts);

    return new Response(JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    }), { status: 200 });
  } catch (err) {
    console.error('[LOGIN] Error interno:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
