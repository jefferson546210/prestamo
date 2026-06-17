export interface Prestamo {
  id: string;
  cliente_id: string;
  monto: number;
  interes: number;
  monto_total: number;
  cuotas: number;
  saldo_restante: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'pendiente' | 'activo' | 'pagado' | 'vencido';
  observaciones: string | null;
  created_at: string;
}

export interface PrestamoFormData {
  cliente_id: string;
  monto: number;
  interes: number;
  cuotas: number;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string;
}