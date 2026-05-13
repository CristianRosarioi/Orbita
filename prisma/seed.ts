// Referencia de unidades de medida base para Órbita RD.
// En producción, estas se crean automáticamente al crear una empresa
// en el endpoint POST /api/empresas/crear (dentro de la transacción).

export const UNIDADES_BASE = [
  { nombre: 'Unidad', abreviatura: 'und' },
  { nombre: 'Kilogramo', abreviatura: 'kg' },
  { nombre: 'Gramo', abreviatura: 'g' },
  { nombre: 'Libra', abreviatura: 'lb' },
  { nombre: 'Onza', abreviatura: 'oz' },
  { nombre: 'Litro', abreviatura: 'L' },
  { nombre: 'Mililitro', abreviatura: 'mL' },
  { nombre: 'Galón', abreviatura: 'gal' },
  { nombre: 'Metro', abreviatura: 'm' },
  { nombre: 'Centímetro', abreviatura: 'cm' },
  { nombre: 'Pulgada', abreviatura: 'in' },
  { nombre: 'Pie', abreviatura: 'ft' },
  { nombre: 'Caja', abreviatura: 'caja' },
  { nombre: 'Paquete', abreviatura: 'paq' },
  { nombre: 'Docena', abreviatura: 'doc' },
  { nombre: 'Saco', abreviatura: 'saco' },
  { nombre: 'Bulto', abreviatura: 'bulto' },
  { nombre: 'Hora', abreviatura: 'hr' },
  { nombre: 'Día', abreviatura: 'día' },
  { nombre: 'Servicio', abreviatura: 'serv' },
] as const;
