import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateSucursalSchema } from '@/lib/validations/sucursales';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const sucursales = await prisma.sucursal.findMany({
      where: { empresaId: sesion.empresaActivaId, deletedAt: null },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });

    return ok(sucursales);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('UNAUTHORIZED', 'Selecciona una empresa activa.', 401);

    const body = await req.json();
    const parsed = CreateSucursalSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const { nombre, codigo, esPrincipal, ...rest } = parsed.data;

    const existe = await prisma.sucursal.findFirst({
      where: { empresaId: sesion.empresaActivaId, codigo, deletedAt: null },
    });
    if (existe) return err('VALIDATION_ERROR', `Ya existe una sucursal con el código "${codigo}".`, 409);

    const sucursal = await prisma.sucursal.create({
      data: {
        empresaId: sesion.empresaActivaId,
        nombre,
        codigo,
        esPrincipal: esPrincipal ?? false,
        ...rest,
      },
    });

    return created(sucursal);
  } catch (e) {
    return handleApiError(e);
  }
}
