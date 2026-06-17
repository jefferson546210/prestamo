import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';
import { revertirCuota } from '../../../services/cuotas.service';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { data: pago, error: findError } = await supabase
      .from('pagos')
      .select('id, prestamo_id, monto_pagado, cuota_id')
      .eq('id', params.id)
      .single();

    if (findError || !pago) {
      return new Response(JSON.stringify({ error: 'Pago no encontrado' }), { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('pagos')
      .delete()
      .eq('id', params.id);

    if (deleteError) return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });

    if (pago.cuota_id) {
      await revertirCuota(pago.cuota_id);
    }

    const { data: prestamo } = await supabase
      .from('prestamos')
      .select('saldo_restante, monto_total')
      .eq('id', pago.prestamo_id)
      .single();

    if (prestamo) {
      const nuevoSaldo = prestamo.saldo_restante + pago.monto_pagado;
      await supabase
        .from('prestamos')
        .update({
          saldo_restante: nuevoSaldo,
          estado: nuevoSaldo > 0 ? 'activo' : 'pagado',
        })
        .eq('id', pago.prestamo_id);
    }

    registrarMovimiento({ cookies } as any, 'pago_eliminado', `Pago RD$ ${pago.monto_pagado} eliminado`);

    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
