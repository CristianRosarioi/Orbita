import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Truck, UserPlus } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { getCurrentEmpresa } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LIMIT = 20;

interface SearchParams {
  page?: string;
  search?: string;
}

async function TablaProveedores({
  empresaId,
  page,
  search,
}: {
  empresaId: string;
  page: number;
  search: string;
}) {
  const skip = (page - 1) * LIMIT;

  const where = {
    empresaId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as const } },
            { nombreComercial: { contains: search, mode: 'insensitive' as const } },
            { identificacion: { contains: search, mode: 'insensitive' as const } },
            { contacto: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [proveedores, total] = await Promise.all([
    prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: LIMIT,
      skip,
      select: {
        id: true,
        nombre: true,
        nombreComercial: true,
        tipoIdentificacion: true,
        identificacion: true,
        contacto: true,
        telefono: true,
        email: true,
        activo: true,
      },
    }),
    prisma.proveedor.count({ where }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  if (proveedores.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Truck className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">No hay proveedores</p>
        <p className="text-sm mt-1">
          {search ? 'No hay resultados para esta búsqueda.' : 'Agrega tu primer proveedor.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nombre</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50">
                <TableCell>
                  <Link
                    href={`/proveedores/${p.id}`}
                    className="font-medium text-slate-900 hover:text-blue-600"
                  >
                    {p.nombreComercial ?? p.nombre}
                  </Link>
                  {p.nombreComercial && (
                    <p className="text-xs text-slate-500">{p.nombre}</p>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {p.identificacion ? (
                    <>
                      <span className="text-xs text-slate-400 mr-1">
                        {p.tipoIdentificacion === 'SIN_IDENTIFICACION'
                          ? '—'
                          : p.tipoIdentificacion}
                      </span>
                      {p.identificacion}
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">{p.contacto ?? '—'}</TableCell>
                <TableCell className="text-slate-600 text-sm">{p.telefono ?? '—'}</TableCell>
                <TableCell className="text-slate-600 text-sm">{p.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant={p.activo ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {skip + 1}–{Math.min(skip + LIMIT, total)} de {total} proveedores
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}&search=${search}`}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}&search=${search}`}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TablaProveedoresSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search ?? '';
  const empresaId = sesion.empresaActivaId;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tu lista de proveedores y suplidores</p>
        </div>
        <Link href="/proveedores/nuevo" className={buttonVariants()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo proveedor
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="GET" className="flex items-center gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nombre, RNC, contacto..."
          className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
        >
          Buscar
        </button>
        {search && (
          <Link href="/proveedores" className="text-sm text-slate-500 hover:text-slate-900">
            Limpiar
          </Link>
        )}
      </form>

      <Suspense fallback={<TablaProveedoresSkeleton />}>
        <TablaProveedores empresaId={empresaId} page={page} search={search} />
      </Suspense>
    </div>
  );
}
