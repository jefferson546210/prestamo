import { supabase } from '../db/supabase';
import type { APIContext } from 'astro';

export async function registrarMovimiento(
  context: APIContext,
  accion: string,
  descripcion: string
) {
  const usuarioId = context.cookies.get('user_id')?.value;
  if (!usuarioId) return;

  await supabase.from('movimientos').insert({
    accion,
    descripcion,
    usuario_id: usuarioId,
  }).maybeSingle();
}
