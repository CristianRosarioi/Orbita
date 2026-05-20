import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateDepartamentoSchema } from '@/lib/validations/super';

const INDUSTRIAS_SUPER = ['SUPERMERCADO', 'MINIMARKET', 'COLMADO_GRANDE'];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const empresaId = sesion.empresaActiva.id;

    const departamentos = await prisma.departamento.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: {
        categorias: {
          where: { activo: true },
          orderBy: { nombre: 'asc' },
          select: { id: true, nombre: true, activo: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: departamentos });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const empresaId = sesion.empresaActiva.id;
    const body = await req.json();
    const parsed = CreateDepartamentoSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const existe = await prisma.departamento.findFirst({
      where: { empresaId, nombre: parsed.data.nombre },
    });
    if (existe) return err('CONFLICT', 'Ya existe un departamento con ese nombre.', 409);

    const departamento = await prisma.departamento.create({
      data: { empresaId, ...parsed.data },
    });

    return created(departamento);
  } catch (e) {
    return handleApiError(e);
  }
}
