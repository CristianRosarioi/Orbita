import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleApiError } from '@/lib/api-response';
import { getOrCreateDbUser } from '@/lib/auth';
import { CreateEmpresaSchema } from '@/lib/validations/empresas';
import { ModoFiscal } from '@/types/enums';
import {
  Industria as PrismaIndustria,
  ModoFiscal as PrismaModoFiscal,
} from '@/generated/prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró. Por favor inicia sesión de nuevo.', 401);

    // Parsear y validar el body
    const body = await req.json().catch(() => null);
    if (!body) return err('INVALID_BODY', 'El formato de los datos enviados no es válido.', 400);

    const parsed = CreateEmpresaSchema.safeParse(body);
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }

    const data = parsed.data;

    // Buscar o crear el usuario en la BD (el webhook puede llegar tarde)
    const usuario = await getOrCreateDbUser();
    if (!usuario) {
      return err('USER_NOT_FOUND', 'No pudimos identificar tu cuenta. Por favor inténtalo de nuevo.', 400);
    }

    // Verificar RNC único (excluyendo eliminados)
    if (data.rnc) {
      const rncExistente = await prisma.empresa.findFirst({
        where: { rnc: data.rnc, deletedAt: null },
        select: { id: true },
      });
      if (rncExistente) {
        return err('CONFLICT', 'Ya existe una empresa registrada con ese RNC.', 409);
      }
    }

    // Validación adicional: FISCAL requiere RNC
    if (data.modoFiscal === ModoFiscal.FISCAL && !data.rnc) {
      return err('VALIDATION_ERROR', 'El RNC es requerido para el modo fiscal.', 422);
    }

    // Crear todo en una sola transacción: Empresa + Membresía + Sucursal + Sesión
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear la empresa
      const empresa = await tx.empresa.create({
        data: {
          nombre: data.nombre,
          nombreComercial: data.nombreComercial,
          // Cast seguro: Zod ya validó que son valores del enum
          industria: data.industria as PrismaIndustria,
          modoFiscal: data.modoFiscal as PrismaModoFiscal,
          rnc: data.rnc,
          telefono: data.telefono,
          direccion: data.direccion,
          trialFinaliza: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 días
        },
      });

      // 2. Crear la membresía del dueño
      await tx.miembroEmpresa.create({
        data: {
          usuarioId: usuario.id,
          empresaId: empresa.id,
          rol: 'OWNER',
          activo: true,
          aceptadoEn: new Date(),
        },
      });

      // 3. Crear la sucursal principal
      const sucursal = await tx.sucursal.create({
        data: {
          empresaId: empresa.id,
          nombre: 'Principal',
          codigo: 'PRI',
          esPrincipal: true,
          activa: true,
        },
      });

      // 4. Crear o actualizar la sesión activa del usuario
      await tx.sesionUsuarioEmpresa.upsert({
        where: { usuarioId: usuario.id },
        create: {
          usuarioId: usuario.id,
          empresaActivaId: empresa.id,
          sucursalActivaId: sucursal.id,
        },
        update: {
          empresaActivaId: empresa.id,
          sucursalActivaId: sucursal.id,
        },
      });

      return { empresa, sucursal };
    });

    return ok(resultado, 201);
  } catch (error) {
    return handleApiError(error, 'crear-empresa');
  }
}
