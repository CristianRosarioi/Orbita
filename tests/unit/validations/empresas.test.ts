import { describe, it, expect } from 'vitest';
import { CreateEmpresaSchema } from '@/lib/validations/empresas';
import { Industria, ModoFiscal } from '@/types/enums';

const baseValida = {
  nombre: 'Distribuidora El Caribe',
  industria: Industria.COLMADO,
  modoFiscal: ModoFiscal.SIMPLE,
};

describe('CreateEmpresaSchema', () => {
  describe('nombre', () => {
    it('acepta un nombre válido', () => {
      expect(CreateEmpresaSchema.safeParse(baseValida).success).toBe(true);
    });

    it('rechaza nombre con menos de 2 caracteres', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, nombre: 'A' });
      expect(r.success).toBe(false);
    });

    it('rechaza nombre con más de 100 caracteres', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, nombre: 'A'.repeat(101) });
      expect(r.success).toBe(false);
    });

    it('rechaza nombre vacío', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, nombre: '' });
      expect(r.success).toBe(false);
    });
  });

  describe('modoFiscal + RNC', () => {
    it('permite modo SIMPLE sin RNC', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, modoFiscal: ModoFiscal.SIMPLE });
      expect(r.success).toBe(true);
    });

    it('rechaza modo FISCAL sin RNC', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, modoFiscal: ModoFiscal.FISCAL });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].path).toContain('rnc');
      }
    });

    it('acepta modo FISCAL con RNC de 9 dígitos', () => {
      const r = CreateEmpresaSchema.safeParse({
        ...baseValida,
        modoFiscal: ModoFiscal.FISCAL,
        rnc: '101765771',
      });
      expect(r.success).toBe(true);
    });

    it('rechaza RNC con menos de 9 dígitos', () => {
      const r = CreateEmpresaSchema.safeParse({
        ...baseValida,
        modoFiscal: ModoFiscal.FISCAL,
        rnc: '12345678',
      });
      expect(r.success).toBe(false);
    });

    it('rechaza RNC con letras', () => {
      const r = CreateEmpresaSchema.safeParse({
        ...baseValida,
        modoFiscal: ModoFiscal.FISCAL,
        rnc: '10176577A',
      });
      expect(r.success).toBe(false);
    });

    it('acepta RNC de 11 dígitos (cédula)', () => {
      const r = CreateEmpresaSchema.safeParse({
        ...baseValida,
        modoFiscal: ModoFiscal.FISCAL,
        rnc: '00112345678',
      });
      expect(r.success).toBe(true);
    });
  });

  describe('industria', () => {
    it('acepta industrias válidas del enum', () => {
      Object.values(Industria).forEach((ind) => {
        const r = CreateEmpresaSchema.safeParse({ ...baseValida, industria: ind });
        expect(r.success).toBe(true);
      });
    });

    it('rechaza industria inválida', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, industria: 'INVALIDA' });
      expect(r.success).toBe(false);
    });
  });

  describe('campos opcionales', () => {
    it('acepta sin nombreComercial', () => {
      const r = CreateEmpresaSchema.safeParse(baseValida);
      expect(r.success).toBe(true);
    });

    it('acepta con nombreComercial válido', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, nombreComercial: 'El Caribe' });
      expect(r.success).toBe(true);
    });

    it('rechaza nombreComercial con 1 carácter', () => {
      const r = CreateEmpresaSchema.safeParse({ ...baseValida, nombreComercial: 'X' });
      expect(r.success).toBe(false);
    });
  });
});
