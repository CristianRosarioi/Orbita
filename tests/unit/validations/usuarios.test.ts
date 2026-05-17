import { describe, it, expect } from 'vitest';
import { InvitarUsuarioSchema, ActualizarRolSchema } from '@/lib/validations/usuarios';

describe('InvitarUsuarioSchema', () => {
  it('acepta email válido y rol permitido', () => {
    const r = InvitarUsuarioSchema.safeParse({ email: 'test@empresa.com', rol: 'ADMIN' });
    expect(r.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const r = InvitarUsuarioSchema.safeParse({ email: 'no-es-email', rol: 'VENDEDOR' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toContain('inválido');
  });

  it('rechaza rol OWNER', () => {
    const r = InvitarUsuarioSchema.safeParse({ email: 'test@empresa.com', rol: 'OWNER' });
    expect(r.success).toBe(false);
  });

  it('rechaza rol inválido', () => {
    const r = InvitarUsuarioSchema.safeParse({ email: 'test@empresa.com', rol: 'SUPERADMIN' });
    expect(r.success).toBe(false);
  });

  it('acepta todos los roles permitidos', () => {
    const roles = ['ADMIN', 'VENDEDOR', 'CONTADOR', 'CAJERO', 'VIEWER'];
    for (const rol of roles) {
      const r = InvitarUsuarioSchema.safeParse({ email: 'test@empresa.com', rol });
      expect(r.success, `rol ${rol} debería ser válido`).toBe(true);
    }
  });

  it('rechaza email vacío', () => {
    const r = InvitarUsuarioSchema.safeParse({ email: '', rol: 'VENDEDOR' });
    expect(r.success).toBe(false);
  });
});

describe('ActualizarRolSchema', () => {
  it('acepta roles permitidos', () => {
    const roles = ['ADMIN', 'VENDEDOR', 'CONTADOR', 'CAJERO', 'VIEWER'];
    for (const rol of roles) {
      const r = ActualizarRolSchema.safeParse({ rol });
      expect(r.success, `rol ${rol} debería ser válido`).toBe(true);
    }
  });

  it('rechaza rol OWNER', () => {
    const r = ActualizarRolSchema.safeParse({ rol: 'OWNER' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.length).toBeGreaterThan(0);
  });

  it('rechaza rol inexistente', () => {
    const r = ActualizarRolSchema.safeParse({ rol: 'DIOS' });
    expect(r.success).toBe(false);
  });

  it('rechaza body vacío', () => {
    const r = ActualizarRolSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});
