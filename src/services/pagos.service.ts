import type { Pago, PagoFormData } from '../types';
import { supabase } from '../db/supabase';

export async function obtenerPagos(): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function obtenerPagosRecientes(limit: number = 5): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha_pago', { ascending: false })  // ← no created_at
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function obtenerPagosPorPrestamo(prestamo_id: string): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('prestamo_id', prestamo_id)
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function registrarPago(pago: PagoFormData): Promise<Pago> {
  const { data, error } = await supabase
    .from('pagos')
    .insert([pago])
    .select()
    .single();

  if (error) throw error;
  return data;
}


