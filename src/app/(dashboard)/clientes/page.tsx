import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserPlus, Users } from 'lucide-react';

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

const LABEL_TIPO: Record<string, string> = {
  PERSONA: 'Persona',
  EMPRESA: 'Empresa',
};

const LABEL_IDENT: Record<string, string> = {
  CEDULA: 'Cédula',
  RNC: 'RNC',
  PASAPORTE: 'Pasaporte',
  SIN_IDENTIFICACION: '—',
};

interface SearchParams {
  page?: string;
  search?: string;
  tipo?: string;
}

async function TablaClientes({
  empresaId,
  page,
  search,
  tipo,
}: {
  empresaId: string;
  page: number;
  search: string;
  tipo: string;
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
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(tipo === 'PERSONA' || tipo === 'EMPRESA' ? { tipo: tipo as 'PERSONA' | 'EMPRESA' } : {}),
  };

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: LIMIT,
      skip,
      select: {
        id: true,
        nombre: true,
        nombreComercial: true,
        tipo: true,
        tipoIdentificacion: true,
        identificacion: true,
        telefono: true,
        email: true,
        activo: true,
      },
    }),
    prisma.cliente.count({ where }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  if (clientes.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Users className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">No hay clientes</p>
        <p className="text-sm mt-1">
          {search || tipo ? 'No hay resultados para estos filtros.' : 'Crea tu primer cliente.'}
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
              <TableHead>Tipo</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-50">
                <TableCell>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="font-medium text-slate-900 hover:text-blue-600"
                  >
                    {c.nombreComercial ?? c.nombre}
                  </Link>
                  {c.nombreComercial && (
                    <p className="text-xs text-slate-500">{c.nombre}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {LABEL_TIPO[c.tipo] ?? c.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {LABEL_IDENT[c.tipoIdentificacion] !== '—' && (
                    <span className="text-xs text-slate-400 mr-1">
                      {LABEL_IDENT[c.tipoIdentificacion]}
                    </span>
                  )}
                  {c.identificacion ?? '—'}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">{c.telefono ?? '—'}</TableCell>
                <TableCell className="text-slate-600 text-sm">{c.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant={c.activo ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {skip + 1}–{Math.min(skip + LIMIT, total)} de {total} clientes
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}&search=${search}&tipo=${tipo}`}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}&search=${search}&tipo=${tipo}`}
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

function TablaClientesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sesion = await getCurrentEmpresa();
  if (!sesion) redirect('/onboarding');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search ?? '';
  const tipo = params.tipo ?? '';
  const empresaId = sesion.empresaActivaId;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tu cartera de clientes</p>
        </div>
        <Link href="/clientes/nuevo" className={buttonVariants()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre, ID..."
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-1">
          <Link
            href={`?search=${search}&tipo=`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              !tipo
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos
          </Link>
          <Link
            href={`?search=${search}&tipo=PERSONA`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              tipo === 'PERSONA'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Personas
          </Link>
          <Link
            href={`?search=${search}&tipo=EMPRESA`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              tipo === 'EMPRESA'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Empresas
          </Link>
        </div>
      </div>

      {/* Tabla con Suspense */}
      <Suspense fallback={<TablaClientesSkeleton />}>
        <TablaClientes empresaId={empresaId} page={page} search={search} tipo={tipo} />
      </Suspense>
    </div>
  );
}
