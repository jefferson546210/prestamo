import type { APIRoute } from 'astro';
import { generarPDFReporte } from '../../../services/reporte.service';

export const GET: APIRoute = async () => {
  try {
    const pdfBuffer = await generarPDFReporte();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="reporte-financiero.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al generar el PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
