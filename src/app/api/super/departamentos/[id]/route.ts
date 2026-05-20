import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { UpdateDepartamentoSchema, CreateCategoriaSuperSchema } from '@/lib/validations/super';

const INDUSTRIAS_SUPER = ['SUPERMERCADO', 'MINIMARKET', 'COLMADO_GRANDE'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const depto = await prisma.departamento.findFirst({ where: { id, empresaId } });
    if (!depto) return err('NOT_FOUND', 'Departamento no encontrado.', 404);

    const body = await req.json();

    // Si viene categorias en el body, crear una nueva categoría
    if (body.categoria) {
      const catParsed = CreateCategoriaSuperSchema.safeParse({
        departamentoId: id,
        nombre: body.categoria,
      });
      if (!catParsed.success) return err('VALIDATION_ERROR', 'Nombre de categoría inválido.', 400);

      const cat = await prisma.categoriaSuper.create({
        data: { empresaId, departamentoId: id, nombre: catParsed.data.nombre },
      });
      return ok(cat);
    }

    const parsed = UpdateDepartamentoSchema.safeParse(body);
    if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos.', 400);

    const actualizado = await prisma.departamento.update({
      where: { id },
      data: parsed.data,
    });

    return ok(actualizado);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion || !INDUSTRIAS_SUPER.includes(sesion.empresaActiva.industria))
      return err('FORBIDDEN', 'Este módulo es exclusivo para supermercados.', 403);

    const { id } = await params;
    const empresaId = sesion.empresaActiva.id;

    const depto = await prisma.departamento.findFirst({ where: { id, empresaId } });
    if (!depto) return err('NOT_FOUND', 'Departamento no encontrado.', 404);

    await prisma.departamento.update({ where: { id }, data: { activo: false } });

    return ok({ mensaje: 'Departamento desactivado.' });
  } catch (e) {
    return handleApiError(e);
  }
}
