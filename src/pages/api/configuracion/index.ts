import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';
import { registrarMovimiento } from '../../../services/audit.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
    }

    if (!body.nombre_empresa) {
      return new Response(JSON.stringify({ error: 'El nombre de la empresa es requerido' }), { status: 400 });
    }

    const { data: existing } = await supabase
      .from('configuracion')
      .select('id')
      .single();

    const payload = {
      nombre_empresa: body.nombre_empresa,
      telefono: body.telefono || null,
      correo: body.correo || null,
      direccion: body.direccion || null,
      interes_default: body.interes_default ?? 0,
    };

    let result;
    if (existing) {
      result = await supabase
        .from('configuracion')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('configuracion')
        .insert([payload])
        .select()
        .single();
    }

    if (result.error) return new Response(JSON.stringify({ error: result.error.message }), { status: 500 });

    registrarMovimiento({ cookies } as any, 'configuracion_actualizada', `Configuración actualizada: ${body.nombre_empresa}`);

    return new Response(JSON.stringify(result.data), { status: existing ? 200 : 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
