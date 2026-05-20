import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_owner' }),
}));

const mockEmpresa = {
  id: 'emp_1',
  nombre: 'Clínica Demo',
  nombreComercial: null,
  industria: 'CLINICA',
  estadoSusc: 'ACTIVO',
  modoFiscal: 'SIMPLE',
  rnc: null,
  trialFinaliza: null,
};

const mockSesion = {
  usuarioId: 'user_owner',
  empresaActivaId: 'emp_1',
  empresaActiva: mockEmpresa,
  sucursalActiva: null,
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn() },
    sesionUsuarioEmpresa: { findUnique: vi.fn() },
    paciente: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    consulta: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

function setupSession() {
  mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user_owner' });
  mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue(mockSesion);
}

const mockPaciente = {
  id: 'pac_1',
  empresaId: 'emp_1',
  numeroExpediente: '000001',
  nombre: 'María',
  apellido: 'Rodríguez',
  cedula: '00100123456',
  fechaNacimiento: new Date('1985-03-15'),
  sexo: 'FEMENINO',
  telefono: '809-555-1234',
  email: 'maria@ejemplo.com',
  tipoSangre: 'O_POSITIVO',
  alergias: 'Penicilina',
  antecedentes: null,
  estado: 'ACTIVO',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { consultas: 2 },
};

const mockConsulta = {
  id: 'con_1',
  empresaId: 'emp_1',
  pacienteId: 'pac_1',
  medicoNombre: 'Dr. García',
  fechaHora: new Date('2026-05-20T09:00:00'),
  motivo: 'Dolor de cabeza',
  diagnostico: null,
  tratamiento: null,
  receta: null,
  peso: null,
  talla: null,
  temperatura: null,
  frecuenciaCard: null,
  presionArterial: null,
  notas: null,
  estado: 'PROGRAMADA',
  precio: null,
  facturaId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  paciente: { id: 'pac_1', nombre: 'María', apellido: 'Rodríguez', numeroExpediente: '000001' },
};

beforeEach(() => {
  vi.clearAllMocks();
  setupSession();
});

// ============================================================
// GET /api/clinica/pacientes
// ============================================================
describe('GET /api/clinica/pacientes', () => {
  it('devuelve lista de pacientes', async () => {
    mockPrisma.paciente.count.mockResolvedValue(1);
    mockPrisma.paciente.findMany.mockResolvedValue([mockPaciente]);

    const { GET } = await import('@/app/api/clinica/pacientes/route');
    const req = new NextRequest('http://localhost/api/clinica/pacientes');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].nombre).toBe('María');
  });

  it('rechaza empresas que no son clínicas', async () => {
    mockPrisma.sesionUsuarioEmpresa.findUnique.mockResolvedValue({
      ...mockSesion,
      empresaActiva: { ...mockEmpresa, industria: 'COLMADO' },
    });

    const { GET } = await import('@/app/api/clinica/pacientes/route');
    const req = new NextRequest('http://localhost/api/clinica/pacientes');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
  });
});

// ============================================================
// POST /api/clinica/pacientes
// ============================================================
describe('POST /api/clinica/pacientes', () => {
  it('crea un paciente correctamente', async () => {
    mockPrisma.paciente.findFirst.mockResolvedValue(null); // no duplicate cedula
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        const txMock = {
          paciente: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockPaciente),
          },
        };
        return fn(txMock);
      },
    );

    const { POST } = await import('@/app/api/clinica/pacientes/route');
    const req = new NextRequest('http://localhost/api/clinica/pacientes', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'María', apellido: 'Rodríguez', cedula: '00100123456' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza cédula duplicada', async () => {
    mockPrisma.paciente.findFirst.mockResolvedValue(mockPaciente); // duplicate

    const { POST } = await import('@/app/api/clinica/pacientes/route');
    const req = new NextRequest('http://localhost/api/clinica/pacientes', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Juan', apellido: 'López', cedula: '00100123456' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('CONFLICT');
  });

  it('rechaza datos inválidos', async () => {
    const { POST } = await import('@/app/api/clinica/pacientes/route');
    const req = new NextRequest('http://localhost/api/clinica/pacientes', {
      method: 'POST',
      body: JSON.stringify({ nombre: '', apellido: '' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================
// GET /api/clinica/consultas
// ============================================================
describe('GET /api/clinica/consultas', () => {
  it('devuelve lista de consultas', async () => {
    mockPrisma.consulta.count.mockResolvedValue(1);
    mockPrisma.consulta.findMany.mockResolvedValue([mockConsulta]);

    const { GET } = await import('@/app/api/clinica/consultas/route');
    const req = new NextRequest('http://localhost/api/clinica/consultas');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].medicoNombre).toBe('Dr. García');
  });

  it('filtra por fecha', async () => {
    mockPrisma.consulta.count.mockResolvedValue(0);
    mockPrisma.consulta.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/clinica/consultas/route');
    const req = new NextRequest('http://localhost/api/clinica/consultas?fecha=2026-05-20');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(mockPrisma.consulta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fechaHora: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});

// ============================================================
// POST /api/clinica/consultas
// ============================================================
describe('POST /api/clinica/consultas', () => {
  it('crea una consulta para paciente existente', async () => {
    mockPrisma.paciente.findFirst.mockResolvedValue(mockPaciente);
    mockPrisma.consulta.create.mockResolvedValue({ ...mockConsulta });

    const { POST } = await import('@/app/api/clinica/consultas/route');
    const req = new NextRequest('http://localhost/api/clinica/consultas', {
      method: 'POST',
      body: JSON.stringify({
        pacienteId: 'pac_1',
        medicoNombre: 'Dr. García',
        fechaHora: new Date('2026-05-20T09:00:00').toISOString(),
        motivo: 'Dolor de cabeza',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(res.status).toBe(201);
  });

  it('rechaza si el paciente no pertenece a la empresa', async () => {
    mockPrisma.paciente.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/clinica/consultas/route');
    const req = new NextRequest('http://localhost/api/clinica/consultas', {
      method: 'POST',
      body: JSON.stringify({
        pacienteId: 'pac_otro',
        medicoNombre: 'Dr. García',
        fechaHora: new Date().toISOString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});

// ============================================================
// GET /api/clinica/agenda
// ============================================================
describe('GET /api/clinica/agenda', () => {
  it('rechaza sin parámetro fecha', async () => {
    const { GET } = await import('@/app/api/clinica/agenda/route');
    const req = new NextRequest('http://localhost/api/clinica/agenda');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve consultas del día', async () => {
    mockPrisma.consulta.findMany.mockResolvedValue([mockConsulta]);

    const { GET } = await import('@/app/api/clinica/agenda/route');
    const req = new NextRequest('http://localhost/api/clinica/agenda?fecha=2026-05-20');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });
});
