import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { requireEmpresa } from '@/lib/auth';
import { UpdateClienteSchema } from '@/lib/validations/clientes';

async function getCliente(id: string, empresaId: string) {
  return prisma.cliente.findFirst({ where: { id, empresaId, deletedAt: null } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;
    const cliente = await getCliente(id, empresaId);
    if (!cliente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);
    return ok(cliente);
  } catch (error) {
    return handleApiError(error, 'GET /api/clientes/[id]');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await getCliente(id, empresaId);
    if (!existente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);

    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = UpdateClienteSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const { tipo, tipoIdentificacion, email, ...rest } = parsed.data;
    const updated = await prisma.cliente.update({
      where: { id },
      data: {
        ...rest,
        ...(tipo && { tipo: tipo as 'PERSONA' | 'EMPRESA' }),
        ...(tipoIdentificacion && {
          tipoIdentificacion: tipoIdentificacion as
            | 'CEDULA'
            | 'RNC'
            | 'PASAPORTE'
            | 'SIN_IDENTIFICACION',
        }),
        email: email === '' ? null : email,
      },
    });
    return ok(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/clientes/[id]');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);
    const empresaId = await requireEmpresa();
    const { id } = await params;

    const existente = await getCliente(id, empresaId);
    if (!existente) return err('NOT_FOUND', 'Cliente no encontrado.', 404);

    await prisma.cliente.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ message: 'Cliente eliminado.' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/clientes/[id]');
  }
}
