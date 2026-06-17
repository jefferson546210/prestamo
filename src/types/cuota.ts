export interface Cuota {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: 'pendiente' | 'pagado' | 'vencido';
  created_at: string;
}