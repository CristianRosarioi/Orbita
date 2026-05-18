import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, created, err, handleApiError } from '@/lib/api-response';
import { getCurrentEmpresa } from '@/lib/auth';
import { CreateNominaSchema } from '@/lib/validations/nomina';
import { calcularItemNomina, calcularNomina } from '@/lib/nomina';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const estado = req.nextUrl.searchParams.get('estado');

    const nominas = await prisma.nomina.findMany({
      where: {
        empresaId: sesion.empresaActivaId,
        deletedAt: null,
        ...(estado ? { estado: estado as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    return ok(nominas);
  } catch (error) {
    return handleApiError(error, 'GET /api/nomina/nominas');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return err('UNAUTHORIZED', 'Tu sesión expiró.', 401);

    const sesion = await getCurrentEmpresa();
    if (!sesion) return err('FORBIDDEN', 'Empresa no encontrada.', 403);

    const body = await req.json();
    const parsed = CreateNominaSchema.safeParse(body);
    if (!parsed.success)
      return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { periodo, fechaInicio, fechaFin, notas, items } = parsed.data;

    // Verificar que todos los empleados existen y pertenecen a la empresa
    const empleadoIds = items.map((i) => i.empleadoId);
    const empleados = await prisma.empleado.findMany({
      where: { id: { in: empleadoIds }, empresaId: sesion.empresaActivaId, deletedAt: null },
      select: { id: true, salarioBase: true },
    });

    if (empleados.length !== empleadoIds.length)
      return err('VALIDATION_ERROR', 'Uno o más empleados no se encontraron.', 422);

    const empleadoMap = new Map(empleados.map((e) => [e.id, e]));

    // Calcular items
    const itemsCalculados = items.map((item) => {
      const empleado = empleadoMap.get(item.empleadoId)!;
      const resultado = calcularItemNomina({
        salarioBase: Number(empleado.salarioBase),
        diasTrabajados: item.diasTrabajados,
        otrosIngresos: item.otrosIngresos,
        otrosDescuentos: item.otrosDescuentos,
      });
      return { empleadoId: item.empleadoId, ...resultado };
    });

    const resumen = calcularNomina(itemsCalculados.map((i) => ({ ...i })));

    const nomina = await prisma.$transaction(async (tx) => {
      const n = await tx.nomina.create({
        data: {
          empresaId: sesion.empresaActivaId,
          periodo,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          notas,
          totalBruto: resumen.totalBruto,
          totalTSS: resumen.totalTSS,
          totalISR: resumen.totalISR,
          totalOtros: resumen.totalOtros,
          totalNeto: resumen.totalNeto,
          creadoPor: sesion.usuarioId,
          items: {
            create: itemsCalculados.map((i) => ({
              empleadoId: i.empleadoId,
              salarioBase: i.salarioBase,
              diasTrabajados: i.diasTrabajados,
              salarioBruto: i.salarioBruto,
              tssTrabajador: i.tssTrabajador,
              tssEmpleador: i.tssEmpleador,
              isr: i.isr,
              otrosDescuentos: i.otrosDescuentos,
              otrosIngresos: i.otrosIngresos,
              salarioNeto: i.salarioNeto,
            })),
          },
        },
        include: {
          items: { include: { empleado: { select: { id: true, nombre: true, apellido: true } } } },
        },
      });
      return n;
    });

    return created(nomina);
  } catch (error) {
    return handleApiError(error, 'POST /api/nomina/nominas');
  }
}
