export interface Pago {
  id: string;
  prestamo_id: string;
  cuota_id: string | null;
  monto_pagado: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  observacion: string | null;
  fecha_pago: string;
}

export interface PagoFormData {
  prestamo_id: string;
  cuota_id?: string;
  monto_pagado: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  observacion?: string;
  fecha_pago: string;
}