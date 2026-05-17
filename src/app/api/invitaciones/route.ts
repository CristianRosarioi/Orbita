import { prisma } from '@/lib/prisma';
import { ok, err, created, handleApiError } from '@/lib/api-response';
import { requireEmpresa, requireRole, getCurrentUser } from '@/lib/auth';
import { InvitarUsuarioSchema } from '@/lib/validations/usuarios';

// GET /api/invitaciones — lista invitaciones pendientes de la empresa
export async function GET() {
  try {
    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();

    const invitaciones = await prisma.invitacion.findMany({
      where: { empresaId, estado: 'PENDIENTE' },
      orderBy: { createdAt: 'desc' },
    });

    return ok(invitaciones);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA') return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN') return err('FORBIDDEN', 'No tienes permisos para ver invitaciones.', 403);
      if (error.message === 'SIN_MEMBRESIA') return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'GET /api/invitaciones');
  }
}

// POST /api/invitaciones — crear invitación
export async function POST(req: Request) {
  try {
    await requireRole(['OWNER', 'ADMIN']);
    const empresaId = await requireEmpresa();
    const usuarioActual = await getCurrentUser();
    if (!usuarioActual) return err('UNAUTHORIZED', 'No autenticado.', 401);

    const body = await req.json();
    const data = InvitarUsuarioSchema.parse(body);

    // Verificar que el email no sea ya miembro activo
    const yaEsMiembro = await prisma.miembroEmpresa.findFirst({
      where: {
        empresaId,
        activo: true,
        usuario: { email: data.email, deletedAt: null },
      },
    });
    if (yaEsMiembro) {
      return err('CONFLICT', 'Este email ya es miembro de la empresa.', 409);
    }

    // Verificar que no haya invitación pendiente para ese email
    const invitacionExistente = await prisma.invitacion.findFirst({
      where: { empresaId, email: data.email, estado: 'PENDIENTE' },
    });
    if (invitacionExistente) {
      return err('CONFLICT', 'Ya existe una invitación pendiente para ese email.', 409);
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitacion = await prisma.invitacion.create({
      data: {
        empresaId,
        email: data.email,
        rol: data.rol,
        token,
        invitadoPor: usuarioActual.clerkId,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
    const link = `${baseUrl}/invitacion?token=${token}`;

    return created({ invitacion, link });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPRESA_REQUERIDA') return err('UNAUTHORIZED', 'No tienes una empresa activa.', 401);
      if (error.message === 'FORBIDDEN') return err('FORBIDDEN', 'No tienes permisos para invitar usuarios.', 403);
      if (error.message === 'SIN_MEMBRESIA') return err('UNAUTHORIZED', 'No tienes acceso a esta empresa.', 401);
    }
    return handleApiError(error, 'POST /api/invitaciones');
  }
}
