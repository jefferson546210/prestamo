import { defineMiddleware } from 'astro/middleware';
import { supabase } from '../db/supabase';

const PUBLIC_ROUTES = ['/', '/login'];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/api/usuarios': ['admin'],
  '/api/configuracion': ['admin', 'gestor'],
  '/api/clientes': ['admin', 'gestor'],
  '/api/prestamos': ['admin', 'gestor'],
  '/api/pagos': ['admin', 'gestor', 'cajero'],
  '/api/reporte': ['admin', 'gestor'],
};

function getRequiredRole(path: string): string | null {
  for (const [prefix, roles] of Object.entries(ROLE_PERMISSIONS)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return null; // any of these roles works, we check below
    }
  }
  // If path starts with /api/ and isn't in ROLE_PERMISSIONS, require admin
  if (path.startsWith('/api/')) return 'admin';
  return null;
}

function hasAccess(path: string, rol: string): boolean {
  for (const [prefix, roles] of Object.entries(ROLE_PERMISSIONS)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return roles.includes(rol);
    }
  }
  if (path.startsWith('/api/')) return false;
  return true;
}

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const path = url.pathname;

  if (PUBLIC_ROUTES.some(r => path === r || path.startsWith('/api/auth'))) {
    return next();
  }

  if (path.startsWith('/dashboard') || path.startsWith('/api/')) {
    const userId = cookies.get('user_id')?.value;
    const userRol = cookies.get('user_rol')?.value;

    if (!userId || !userRol) {
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
      }
      return redirect('/login');
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .eq('activo', true)
      .single();

    if (!usuario) {
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 });
      }
      cookies.delete('user_id', { path: '/' });
      cookies.delete('user_rol', { path: '/' });
      cookies.delete('user_nombre', { path: '/' });
      return redirect('/login');
    }

    // Role-based access control
    if (!hasAccess(path, userRol)) {
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No tienes permisos para esta acción' }), { status: 403 });
      }
      return redirect('/dashboard');
    }
  }

  return next();
});
