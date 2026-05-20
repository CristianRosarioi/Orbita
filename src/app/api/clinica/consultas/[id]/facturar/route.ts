import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { generarNumeroFactura } from '@/lib/facturacion';

const INDUSTRIAS_CLINICA = ['CLINICA', 'DENTAL', 'VETERINARIA'];

const FacturarConsultaSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']).default('EFECTIVO'),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_CLINICA.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para clínicas.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const consulta = await prisma.consulta.findFirst({
      where: { id, empresaId },
      include: { paciente: { select: { nombre: true, apellido: true, clienteId: true } } },
    });
    if (!consulta) return err('NOT_FOUND', 'Consulta no encontrada.', 404);
    if (consulta.estado !== 'COMPLETADA')
      return err('VALIDATION_ERROR', 'Solo se pueden facturar consultas completadas.', 422);
    if (consulta.facturaId) return err('VALIDATION_ERROR', 'Esta consulta ya fue facturada.', 422);
    if (!consulta.precio || Number(consulta.precio) <= 0)
      return err('VALIDATION_ERROR', 'La consulta no tiene precio registrado.', 422);

    const body = await req.json();
    const parsed = FacturarConsultaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const precio = Number(consulta.precio);
    const itbisMonto = Math.round(precio * 0.18 * 100) / 100;
    const subtotal = precio;
    const total = Math.round((subtotal + itbisMonto) * 100) / 100;
    const clienteNombre = `${consulta.paciente.nombre} ${consulta.paciente.apellido}`;

    const factura = await prisma.$transaction(async (tx) => {
      const { numero, numeroInt, anio } = await generarNumeroFactura(empresaId, tx as never);

      const nuevaFactura = await tx.factura.create({
        data: {
          empresaId,
          numero,
          numeroInt,
          anio,
          clienteId: consulta.paciente.clienteId,
          clienteNombre,
          metodoPago: parsed.data.metodoPago,
          estado: parsed.data.metodoPago === 'CREDITO' ? 'EMITIDA' : 'PAGADA',
          subtotal,
          itbis: itbisMonto,
          descuento: 0,
          total,
          saldo: parsed.data.metodoPago === 'CREDITO' ? total : 0,
          creadoPor: sesion.usuarioId,
          items: {
            create: [
              {
                productoNombre: consulta.motivo ?? 'Consulta médica',
                cantidad: 1,
                precioUnitario: precio,
                itbisPorcentaje: 18,
                itbisMonto,
                descuento: 0,
                subtotal,
                total,
              },
            ],
          },
        },
      });

      await tx.consulta.update({
        where: { id },
        data: { facturaId: nuevaFactura.id },
      });

      return nuevaFactura;
    });

    return ok({ facturaId: factura.id, numero: factura.numero, total: factura.total });
  } catch (e) {
    return handleApiError(e, 'POST /api/clinica/consultas/[id]/facturar');
  }
}
