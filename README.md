# Sistema de Gestión de Préstamos

Sistema web para administrar préstamos, clientes, pagos y cuotas con control de acceso basado en roles.

## Stack

- **Framework**: [Astro](https://astro.build) (SSR con `@astrojs/node`)
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Cookies httpOnly + bcrypt contra tabla `usuarios`
- **Gráficos**: Chart.js vía CDN
- **PDF**: html2pdf.js vía CDN

## Roles

| Rol | Acceso |
|---|---|
| **admin** | Todo el sistema |
| **gestor** | Clientes, Préstamos, Pagos, Configuración |
| **cajero** | Solo Pagos |

## Instalación

```bash
git clone <repo>
cd prestamos
npm install
```

## Configuración

Crear archivo `.env` en la raíz:

```env
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
```

> `SUPABASE_SERVICE_KEY` se usa server-side (Astro SSR), nunca se expone al cliente.

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Previsualiza build local |

## Estructura

```
src/
├── pages/
│   ├── dashboard/        # UI protegida (requiere login)
│   │   ├── clientes/     # CRUD clientes
│   │   ├── prestamos/    # CRUD préstamos + plan de cuotas
│   │   ├── pagos/        # Registro de pagos
│   │   ├── usuarios/     # Gestión de usuarios (admin)
│   │   └── reporte/      # Reportes financieros + PDF
│   └── api/              # Endpoints REST
├── services/             # Lógica de negocio
├── layouts/              # Layouts compartidos
├── db/                   # Cliente Supabase
└── middleware/            # Auth + control de roles
```

## Funcionalidades

- **Auth**: Login con email/contraseña, bcrypt + plaintext, sesión por cookies (7 días), logout
- **Clientes**: CRUD completo, búsqueda, exportar CSV
- **Préstamos**: Creación con cálculo de monto total + interés, saldo restante, estados (activo/pagado/vencido)
- **Cuotas**: Generación automática al crear préstamo, seguimiento por número, montos, vencimientos y estado
- **Pagos**: Registro con selección de cuota, validación de saldo, actualización automática de saldo, exportar CSV
- **Reportes**: Dashboard con KPIs, gráficos (Chart.js), tabla de vencidos, descarga PDF
- **Configuración**: Datos de la empresa
- **Dark mode**: Sidebar toggle, persistido en localStorage
- **Notificaciones toast**: Feedback visual en todas las acciones
- **Confirmación modal**: Reemplaza `confirm()` nativo en eliminaciones

## Base de datos

Tablas principales en Supabase:

- `usuarios` — nombre, correo, password (bcrypt), rol, activo
- `clientes` — nombre, apellido, cedula, telefono, correo, direccion, activo
- `prestamos` — cliente_id, monto, interes, cuotas, monto_total, saldo_restante, estado, fechas
- `cuotas` — prestamo_id, numero_cuota, monto, fecha_vencimiento, fecha_pago, estado
- `pagos` — prestamo_id, monto_pagado, metodo_pago, fecha_pago, cuota_id, observacion
- `movimientos` — accion, descripcion, usuario_id (auditoría)
- `configuracion` — nombre_empresa, telefono, correo, direccion, interes_default
