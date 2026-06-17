export interface Movimiento {
  id: string;
  usuario_id: string;
  accion: string;
  descripcion: string | null;
  fecha: string;
}