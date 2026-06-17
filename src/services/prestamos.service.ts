import type { Prestamo, PrestamoFormData } from '../types';
import { supabase } from '../db/supabase';

export async function obtenerPrestamos(): Promise<Prestamo[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function obtenerPrestamosRecientes(limit: number = 5): Promise<Prestamo[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obtenerPrestamosPorCliente(cliente_id: string): Promise<Prestamo[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('cliente_id', cliente_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function obtenerPrestamoPorId(id: string): Promise<Prestamo | null> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function crearPrestamo(prestamo: PrestamoFormData): Promise<Prestamo> {
  const monto_total = prestamo.monto + (prestamo.monto * prestamo.interes / 100);

  const { data, error } = await supabase
    .from('prestamos')
    .insert([{
      ...prestamo,
      monto_total,
      saldo_restante: monto_total,
      estado: 'pendiente',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}