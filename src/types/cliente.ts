export interface Cliente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
  created_at: string;
}

export interface ClienteFormData {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  activo: boolean;
}