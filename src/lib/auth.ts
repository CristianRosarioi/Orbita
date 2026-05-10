import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { type RolEmpresa } from '../generated/prisma/client';

// ============================================================
// Helpers de autenticación y multitenancy
// Usar en Server Components y API Routes
// ============================================================

/**
 * Retorna el usuario actual desde la BD (sincronizado con Clerk).
 * Retorna null si no hay sesión o si el usuario no existe en la BD todavía.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
  });
}

/**
 * Retorna la empresa activa del usuario (según SesionUsuarioEmpresa).
 * Retorna null si el usuario no tiene empresa activa.
 */
export async function getCurrentEmpresa() {
  const { userId } = await auth();
  if (!userId) return null;

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!usuario) return null;

  const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      empresaActiva: true,
      sucursalActiva: true,
    },
  });

  return sesion ?? null;
}

/**
 * Retorna la membresía activa del usuario en su empresa actual.
 * Incluye el rol para verificación de permisos.
 */
export async function getCurrentMembership() {
  const { userId } = await auth();
  if (!userId) return null;

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!usuario) return null;

  const sesion = await prisma.sesionUsuarioEmpresa.findUnique({
    where: { usuarioId: usuario.id },
    select: { empresaActivaId: true },
  });
  if (!sesion) return null;

  return prisma.miembroEmpresa.findFirst({
    where: {
      usuarioId: usuario.id,
      empresaId: sesion.empresaActivaId,
      activo: true,
    },
    include: { empresa: true },
  });
}

/**
 * Retorna el ID de la empresa activa o lanza un error si no hay ninguna.
 * Usar en API Routes que requieren empresa activa.
 */
export async function requireEmpresa(): Promise<string> {
  const sesion = await getCurrentEmpresa();
  if (!sesion) {
    throw new Error('EMPRESA_REQUERIDA');
  }
  return sesion.empresaActivaId;
}

/**
 * Verifica que el usuario tiene uno de los roles indicados en su empresa activa.
 * Lanza un error si no tiene el rol requerido.
 */
export async function requireRole(rolesPermitidos: RolEmpresa[]): Promise<void> {
  const membresia = await getCurrentMembership();
  if (!membresia) throw new Error('SIN_MEMBRESIA');

  if (!rolesPermitidos.includes(membresia.rol)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Busca o crea el usuario en la BD a partir de la sesión de Clerk.
 * Útil en endpoints donde el webhook pudo llegar tarde.
 */
export async function getOrCreateDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existente = await prisma.usuario.findFirst({
    where: { clerkId: userId, deletedAt: null },
  });
  if (existente) return existente;

  // El webhook puede no haber llegado todavía — crear el usuario desde Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  return prisma.usuario.create({
    data: {
      clerkId: userId,
      email,
      nombre: clerkUser.firstName ?? null,
      apellido: clerkUser.lastName ?? null,
      avatar: clerkUser.imageUrl ?? null,
    },
  });
}
