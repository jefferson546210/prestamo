import type { Usuario } from '../types';
import { supabase } from '../db/supabase';

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, activo, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function obtenerUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}