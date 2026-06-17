export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: 'admin' | 'gestor' | 'cajero';
  activo: boolean;
  created_at: string;
}

export interface LoginData {
  correo: string;
  password: string;
}