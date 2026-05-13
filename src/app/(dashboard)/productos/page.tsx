import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PackagePlus, Package } from 'lucide-react';

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

const LABEL_TIPO: Record<string, string> = { BIEN: 'Bien', SERVICIO: 'Servicio' };

interface SearchParams {
  page?: string;
  search?: string;
  tipo?: string;
  categoriaId?: string;
}

async function TablaProductos({
  empresaId,
  page,
  search,
  tipo,
  categoriaId,
}: {
  empresaId: string;
  page: number;
  search: string;
  tipo: string;
  categoriaId: string;
}) {
  const skip = (page - 1) * LIMIT;

  const where = {
    empresaId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
            { codigoBarras: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(tipo === 'BIEN' || tipo === 'SERVICIO' ? { tipo: tipo as 'BIEN' | 'SERVICIO' } : {}),
    ...(categoriaId ? { categoriaId } : {}),
  };

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: LIMIT,
      skip,
      select: {
        id: true,
        nombre: true,
        sku: true,
        tipo: true,
        precioVenta: true,
        activo: true,
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.producto.count({ where }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Package className="mx-auto h-10 w-10 mb-3 text-slate-300" />
        <p className="font-medium">No hay productos</p>
        <p className="text-sm mt-1">
          {search || tipo || categoriaId
            ? 'No hay resultados para estos filtros.'
            : 'Crea tu primer producto.'}
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
              <TableHead>SKU</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50">
                <TableCell>
                  <Link
                    href={`/productos/${p.id}`}
                    className="font-medium text-slate-900 hover:text-blue-600"
                  >
                    {p.nombre}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-500 text-sm font-mono">{p.sku ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {LABEL_TIPO[p.tipo] ?? p.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {p.categoria?.nombre ?? '—'}
                </TableCell>
                <TableCell className="text-right text-slate-900 font-medium text-sm">
                  RD$ {Number(p.precioVenta).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </TableCell>
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
            {skip + 1}–{Math.min(skip + LIMIT, total)} de {total} productos
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}&search=${search}&tipo=${tipo}&categoriaId=${categoriaId}`}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}&search=${search}&tipo=${tipo}&categoriaId=${categoriaId}`}
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

function TablaProductosSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

export default async function ProductosPage({
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
  const categoriaId = params.categoriaId ?? '';
  const empresaId = sesion.empresaActivaId;

  // Cargar categorías para el filtro
  const categorias = await prisma.categoria.findMany({
    where: { empresaId, deletedAt: null, activa: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tu catálogo de productos y servicios</p>
        </div>
        <Link href="/productos/nuevo" className={buttonVariants()}>
          <PackagePlus className="h-4 w-4 mr-2" />
          Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre, SKU..."
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          {categoriaId && <input type="hidden" name="categoriaId" value={categoriaId} />}
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-1">
          <Link
            href={`?search=${search}&tipo=&categoriaId=${categoriaId}`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              !tipo
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos
          </Link>
          <Link
            href={`?search=${search}&tipo=BIEN&categoriaId=${categoriaId}`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              tipo === 'BIEN'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bienes
          </Link>
          <Link
            href={`?search=${search}&tipo=SERVICIO&categoriaId=${categoriaId}`}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              tipo === 'SERVICIO'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Servicios
          </Link>
        </div>

        {categorias.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`?search=${search}&tipo=${tipo}&categoriaId=${categoriaId === c.id ? '' : c.id}`}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  categoriaId === c.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={<TablaProductosSkeleton />}>
        <TablaProductos
          empresaId={empresaId}
          page={page}
          search={search}
          tipo={tipo}
          categoriaId={categoriaId}
        />
      </Suspense>
    </div>
  );
}
