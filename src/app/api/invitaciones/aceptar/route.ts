import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getOrCreateDbUser } from '@/lib/auth';

// GET /api/invitaciones/aceptar?token=xxx — verifica el token (pública)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return err('VALIDATION_ERROR', 'Token requerido.', 400);

    const invitacion = await prisma.invitacion.findUnique({
      where: { token },
      include: {
        empresa: { select: { id: true, nombre: true, nombreComercial: true } },
      },
    });

    if (!invitacion) return err('NOT_FOUND', 'La invitación no existe o el link es inválido.', 404);
    if (invitacion.estado !== 'PENDIENTE') {
      return err('CONFLICT', 'Esta invitación ya fue utilizada o cancelada.', 409);
    }
    if (invitacion.expiresAt < new Date()) {
      await prisma.invitacion.update({ where: { token }, data: { estado: 'EXPIRADA' } });
      return err('GONE', 'Esta invitación ha expirado. Solicita una nueva al administrador.', 410);
    }

    // Buscar nombre del que invitó
    const invitador = await prisma.usuario.findFirst({
      where: { clerkId: invitacion.invitadoPor, deletedAt: null },
      select: { nombre: true, apellido: true, email: true },
    });

    return ok({
      email: invitacion.email,
      rol: invitacion.rol,
      empresa: invitacion.empresa,
      invitadoPor: invitador
        ? `${invitador.nombre ?? ''} ${invitador.apellido ?? ''}`.trim() || invitador.email
        : 'un administrador',
      expiresAt: invitacion.expiresAt,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/invitaciones/aceptar');
  }
}

// POST /api/invitaciones/aceptar — acepta la invitación (requiere usuario logueado)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return err('UNAUTHORIZED', 'Debes iniciar sesión para aceptar la invitación.', 401);

    const body = await req.json();
    const token = body?.token as string | undefined;
    if (!token) return err('VALIDATION_ERROR', 'Token requerido.', 400);

    const invitacion = await prisma.invitacion.findUnique({
      where: { token },
      include: { empresa: true },
    });
    if (!invitacion) return err('NOT_FOUND', 'La invitación no existe.', 404);
    if (invitacion.estado !== 'PENDIENTE') {
      return err('CONFLICT', 'Esta invitación ya fue utilizada o cancelada.', 409);
    }
    if (invitacion.expiresAt < new Date()) {
      await prisma.invitacion.update({ where: { token }, data: { estado: 'EXPIRADA' } });
      return err('GONE', 'Esta invitación ha expirado.', 410);
    }

    // Verificar email del usuario logueado
    const clerkUser = await currentUser();
    if (!clerkUser) return err('UNAUTHORIZED', 'No autenticado.', 401);

    const emailClerk =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (emailClerk?.toLowerCase() !== invitacion.email.toLowerCase()) {
      return err(
        'FORBIDDEN',
        `Esta invitación es para ${invitacion.email}. Inicia sesión con esa cuenta.`,
        403,
      );
    }

    const usuario = await getOrCreateDbUser();
    if (!usuario) return err('INTERNAL_ERROR', 'Error al obtener el usuario.', 500);

    // Verificar que no sea ya miembro
    const yaEsMiembro = await prisma.miembroEmpresa.findFirst({
      where: { usuarioId: usuario.id, empresaId: invitacion.empresaId },
    });
    if (yaEsMiembro) {
      if (!yaEsMiembro.activo) {
        await prisma.miembroEmpresa.update({
          where: { id: yaEsMiembro.id },
          data: { activo: true, rol: invitacion.rol },
        });
      } else {
        return err('CONFLICT', 'Ya eres miembro de esta empresa.', 409);
      }
    } else {
      await prisma.miembroEmpresa.create({
        data: {
          usuarioId: usuario.id,
          empresaId: invitacion.empresaId,
          rol: invitacion.rol,
          activo: true,
          invitadoPor: invitacion.invitadoPor,
          aceptadoEn: new Date(),
        },
      });
    }

    // Marcar invitación como aceptada
    await prisma.invitacion.update({
      where: { token },
      data: { estado: 'ACEPTADA', aceptadoEn: new Date() },
    });

    // Actualizar sesión activa del usuario hacia la nueva empresa
    await prisma.sesionUsuarioEmpresa.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, empresaActivaId: invitacion.empresaId },
      update: { empresaActivaId: invitacion.empresaId, sucursalActivaId: null },
    });

    return ok({ empresaId: invitacion.empresaId, empresaNombre: invitacion.empresa.nombre });
  } catch (error) {
    return handleApiError(error, 'POST /api/invitaciones/aceptar');
  }
}
