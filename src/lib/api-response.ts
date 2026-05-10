import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client';

// ============================================================
// Helpers de respuesta estándar
// Formato: { success, data } | { success, error: { code, message } }
// ============================================================

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// ============================================================
// Manejo centralizado de errores de Prisma
// ============================================================

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2002': {
      const campo = (error.meta?.target as string[])?.join(', ') ?? 'campo';
      return err('CONFLICT', `Ya existe un registro con ese ${campo}.`, 409);
    }
    case 'P2025':
      return err('NOT_FOUND', 'El registro que intentas modificar no existe o fue eliminado.', 404);
    case 'P2003':
      return err('CONFLICT', 'No se puede completar la operación porque tiene datos relacionados.', 409);
    case 'P2034':
      return err('CONFLICT', 'Hubo un conflicto al procesar la solicitud. Por favor inténtalo de nuevo.', 409);
    case 'P1001':
      console.error('[DB] Base de datos no disponible', { code: error.code });
      return err('SERVICE_UNAVAILABLE', 'El servicio no está disponible en este momento. Por favor inténtalo en unos minutos.', 503);
    default:
      console.error('[DB] Error de Prisma no manejado', { code: error.code });
      return err('INTERNAL_ERROR', 'Ocurrió un error al procesar tu solicitud.', 500);
  }
}

// ============================================================
// Wrapper principal de manejo de errores para endpoints
// ============================================================

export function handleApiError(error: unknown, contexto = 'endpoint'): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof ZodError) {
    const primer = error.issues[0];
    return err('VALIDATION_ERROR', primer?.message ?? 'Datos inválidos.', 422);
  }

  // Error no esperado — loggear sin datos sensibles
  console.error(`[API] Error inesperado en ${contexto}`, {
    tipo: error instanceof Error ? error.constructor.name : typeof error,
    message: error instanceof Error ? error.message : 'Desconocido',
  });

  return err('INTERNAL_ERROR', 'Ocurrió un problema inesperado. Por favor inténtalo de nuevo.', 500);
}
