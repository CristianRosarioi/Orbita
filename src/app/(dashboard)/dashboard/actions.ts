'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Oculta el bloque "Próximos pasos" del dashboard para la empresa activa.
 * La preferencia se persiste por empresa (no por usuario) porque el onboarding
 * refleja el estado de configuración de la empresa, no del usuario individual.
 */
export async function ocultarOnboarding(): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { success: false };

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!usuario) return { success: false };

  const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
    where: { usuarioId: usuario.id },
    select: { empresaActivaId: true },
  });
  if (!sesion) return { success: false };

  // Verificar que el usuario es miembro activo de la empresa (autorización)
  const membresia = await prisma.miembroEmpresa.findFirst({
    where: { usuarioId: usuario.id, empresaId: sesion.empresaActivaId, activo: true },
    select: { id: true },
  });
  if (!membresia) return { success: false };

  await prisma.empresa.update({
    where: { id: sesion.empresaActivaId },
    data: { onboardingOculto: true },
  });

  revalidatePath('/dashboard');
  return { success: true };
}
