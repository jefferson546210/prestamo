import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete('user_id', { path: '/' });
  cookies.delete('user_rol', { path: '/' });
  cookies.delete('user_nombre', { path: '/' });
  return new Response(null, { status: 200 });
};
