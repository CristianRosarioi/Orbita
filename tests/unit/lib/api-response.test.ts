import { describe, it, expect } from 'vitest';
import { ok, created, err } from '@/lib/api-response';

describe('api-response helpers', () => {
  describe('ok()', () => {
    it('retorna status 200 por defecto', async () => {
      const res = ok({ id: '1' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: '1' });
    });

    it('acepta status personalizado', async () => {
      const res = ok({ id: '1' }, 202);
      expect(res.status).toBe(202);
    });
  });

  describe('created()', () => {
    it('retorna status 201', async () => {
      const res = created({ id: 'nuevo' });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('err()', () => {
    it('retorna success: false con código y mensaje', async () => {
      const res = err('NOT_FOUND', 'No encontrado.', 404);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('No encontrado.');
    });

    it('usa status 400 por defecto', async () => {
      const res = err('BAD', 'Malo');
      expect(res.status).toBe(400);
    });
  });
});
