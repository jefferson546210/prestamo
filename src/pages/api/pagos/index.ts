import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';
import { obtenerCuotasPendientes, marcarCuotaPagada } from '../../../services/cuotas.service';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('pagos')
      .select(`*, prestamos(monto, clientes(nombre, apellido))`)
      .order('fecha_pago', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
    }

    if (!body.prestamo_id || !body.monto_pagado || !body.metodo_pago || !body.fecha_pago) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: prestamo_id, monto_pagado, metodo_pago, fecha_pago' }), { status: 400 });
    }

    const metodosValidos = ['efectivo', 'transferencia', 'tarjeta'];
    if (!metodosValidos.includes(body.metodo_pago)) {
      return new Response(JSON.stringify({ error: 'Método de pago inválido. Use: efectivo, transferencia, tarjeta' }), { status: 400 });
    }

    if (body.monto_pagado <= 0) {
      return new Response(JSON.stringify({ error: 'El monto pagado debe ser mayor a 0' }), { status: 400 });
    }

    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .select('saldo_restante')
      .eq('id', body.prestamo_id)
      .single();

    if (prestamoError || !prestamo) {
      return new Response(JSON.stringify({ error: 'Préstamo no encontrado' }), { status: 404 });
    }

    if (body.monto_pagado > prestamo.saldo_restante) {
      return new Response(JSON.stringify({ error: `El monto excede el saldo restante (RD$ ${prestamo.saldo_restante.toLocaleString()})` }), { status: 400 });
    }

    // Resolve cuota a pagar
    let cuotaId = body.cuota_id || null;
    if (!cuotaId) {
      const pendientes = await obtenerCuotasPendientes(body.prestamo_id);
      if (pendientes.length > 0) {
        cuotaId = pendientes[0].id;
      }
    }

    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert([{
        prestamo_id: body.prestamo_id,
        monto_pagado: body.monto_pagado,
        metodo_pago: body.metodo_pago,
        fecha_pago: body.fecha_pago,
        observacion: body.observacion || null,
        cuota_id: cuotaId,
      }])
      .select()
      .single();

    if (pagoError) return new Response(JSON.stringify({ error: pagoError.message }), { status: 500 });

    if (cuotaId) {
      await marcarCuotaPagada(cuotaId, body.fecha_pago);
    }

    const nuevo_saldo = prestamo.saldo_restante - body.monto_pagado;
    const { error: updateError } = await supabase
      .from('prestamos')
      .update({
        saldo_restante: Math.max(0, nuevo_saldo),
        estado: nuevo_saldo <= 0 ? 'pagado' : 'activo',
      })
      .eq('id', body.prestamo_id);

    if (updateError) {
      console.error('[PAGOS] Error actualizando saldo del préstamo:', updateError);
    }

    const metodoLabel = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' }[body.metodo_pago] || body.metodo_pago;
    registrarMovimiento({ cookies } as any, 'pago_registrado', `Pago RD$ ${body.monto_pagado} registrado (${metodoLabel})`);

    return new Response(JSON.stringify(pago), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
