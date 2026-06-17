export interface Configuracion {
  id: string;
  nombre_empresa: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  interes_default: number;
  created_at: string;
}