export type VerticalSlug =
  | 'restaurante'
  | 'colmado'
  | 'carwash'
  | 'repuestos'
  | 'taller'
  | 'ferreteria'
  | 'salon'
  | 'clinica'
  | 'inmobiliaria'
  | 'farmacia'
  | 'tienda_ropa'
  | 'tienda_online'
  | 'joyeria'
  | 'supermercado';

export interface VerticalData {
  slug: VerticalSlug;
  nombre: string;
  emoji: string;
  tagline: string;
  descripcionCorta: string;
  color: { bg: string; text: string; ring: string; badge: string };
  funciones: string[];
  funccionesDetalladas: { titulo: string; desc: string }[];
  paraQuien: string[];
  ejemplos: string[];
  ctaLabel: string;
}

export const VERTICALES: Record<VerticalSlug, VerticalData> = {
  restaurante: {
    slug: 'restaurante',
    nombre: 'Restaurante / Bar / Comedor',
    emoji: '🍽️',
    tagline: 'De la comanda a la factura, sin papeles ni confusiones',
    descripcionCorta:
      'Gestiona mesas, comandas y cocina en tiempo real. Factura directo desde la mesa.',
    color: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-200',
      badge: 'bg-orange-100 text-orange-700',
    },
    funciones: [
      'Control de mesas con estados en tiempo real',
      'Comandas digitales por mesa para meseros',
      'Pantalla de cocina tipo kanban (KDS)',
      'Facturación directa desde la mesa con propina',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Mesas en tiempo real',
        desc: 'Visualiza el estado de todas las mesas: disponible, ocupada o reservada. Actualización instantánea sin recargar la página. Ideal para el maître o el encargado.',
      },
      {
        titulo: 'Comandas digitales',
        desc: 'Tus meseros toman los pedidos directamente en el sistema. No más papeles perdidos ni malos entendidos con la cocina. Cada comanda va directo a la pantalla de cocina.',
      },
      {
        titulo: 'Pantalla de cocina (KDS)',
        desc: 'La cocina tiene su propia pantalla con los pedidos organizados por estado. Kanban estilo restaurante profesional: Pendiente → En preparación → Listo.',
      },
      {
        titulo: 'Modificadores de productos',
        desc: 'Agrega instrucciones por ítem directamente en la comanda: sin cebolla, extra queso, término medio. Todo llega claro a la cocina.',
      },
      {
        titulo: 'División de cuenta y propina',
        desc: 'Divide la cuenta entre varios clientes con un clic. Aplica propina automática del 10% o el porcentaje que decidas.',
      },
      {
        titulo: 'Facturación directa',
        desc: 'Al cerrar la comanda, genera la factura en segundos. Acepta efectivo, tarjeta o crédito. Imprime o envía por WhatsApp.',
      },
    ],
    paraQuien: [
      'Restaurantes familiares',
      'Bares y cafeterías',
      'Food courts',
      'Comedores corporativos',
      'Food trucks',
    ],
    ejemplos: [
      'El mesero toma el pedido en su tablet, la cocina lo ve en 2 segundos',
      'El cliente pide la cuenta, el cajero la genera sin buscar papeles',
      'El dueño ve las ventas del día desde su celular aunque no esté en el local',
    ],
    ctaLabel: '¿Tienes un restaurante o bar?',
  },

  colmado: {
    slug: 'colmado',
    nombre: 'Colmado / Minimarket',
    emoji: '🛒',
    tagline: 'POS rápido, fiado digital y control de inventario para tu negocio',
    descripcionCorta:
      'Todo lo que necesita un colmado o minimarket en un solo sistema. POS, fiado, inventario y cierres de caja.',
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-200',
      badge: 'bg-blue-100 text-blue-700',
    },
    funciones: [
      'POS ultra rápido — búsqueda por nombre',
      'Fiado digital con límite de crédito por cliente',
      'Precio por mayor y por menor',
      'Control de vencimientos e inventario',
    ],
    funccionesDetalladas: [
      {
        titulo: 'POS ultra rápido',
        desc: 'Busca productos por nombre, SKU o código de barras. El sistema es tan rápido que no interrumpe el flujo de ventas en horas pico.',
      },
      {
        titulo: 'Fiado con control',
        desc: 'El fiado deja de ser un cuaderno. Cada cliente tiene su cuenta con límite de crédito, historial de cargos y abonos, y saldo siempre visible.',
      },
      {
        titulo: 'Precio mayor y menor',
        desc: 'Define precios por unidad y por bulto o caja. El sistema aplica el precio correcto según la cantidad que el cliente está comprando.',
      },
      {
        titulo: 'Control de vencimientos',
        desc: 'Registra la fecha de vencimiento de tus productos perecederos. El sistema te alerta antes de que venzan para que los puedas rotar o retirar.',
      },
      {
        titulo: 'Inventario por unidad y bulto',
        desc: 'Lleva el inventario en la unidad que uses — botellas, cajas, sacos. El stock se descuenta automáticamente con cada venta.',
      },
      {
        titulo: 'Cierre de turno',
        desc: 'Al cerrar el turno, el sistema genera un resumen completo: efectivo, tarjeta, fiado y total vendido. Sin sorpresas al cuadrar la caja.',
      },
    ],
    paraQuien: ['Colmados de barrio', 'Minimarkets', 'Bodegas', 'Tiendas de abarrotes'],
    ejemplos: [
      'El cajero busca el producto por nombre y aparece en medio segundo',
      'El cliente de fiado llega y el cajero ve su saldo al instante',
      'Al cerrar el turno, el resumen aparece automáticamente sin calcular nada a mano',
    ],
    ctaLabel: '¿Tienes un colmado o minimarket?',
  },

  carwash: {
    slug: 'carwash',
    nombre: 'Carwash / Lavado de Vehículos',
    emoji: '🚗',
    tagline: 'Cola de vehículos, tiempos por servicio e historial por placa',
    descripcionCorta:
      'Organiza tu carwash con órdenes digitales, cola en tiempo real e historial de cada vehículo.',
    color: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      ring: 'ring-sky-200',
      badge: 'bg-sky-100 text-sky-700',
    },
    funciones: [
      'Orden por vehículo con placa, color y modelo',
      'Cola de vehículos en tiempo real',
      'Tiempo estimado por tipo de servicio',
      'Historial completo de servicios por placa',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Orden por vehículo',
        desc: 'Crea una orden para cada vehículo con placa, color, modelo y tipo de servicio. Todo queda registrado desde que el cliente llega hasta que sale.',
      },
      {
        titulo: 'Cola en tiempo real',
        desc: 'Ve todos los vehículos en proceso en una sola pantalla. Asigna empleados, cambia estados y gestiona la cola sin salir del sistema.',
      },
      {
        titulo: 'Tiempo estimado',
        desc: 'Cada tipo de lavado tiene un tiempo estimado. El sistema calcula cuándo estará listo el vehículo para que el cliente sepa cuánto esperar.',
      },
      {
        titulo: 'Historial por placa',
        desc: 'Busca cualquier placa y ve todos los servicios anteriores de ese vehículo, con fecha, tipo de lavado y monto. Ideal para clientes frecuentes.',
      },
      {
        titulo: 'Facturación rápida',
        desc: 'Al terminar, genera la factura en segundos. Acepta efectivo o tarjeta. Los reportes del día muestran cuántos vehículos atendiste y cuánto ingresó.',
      },
    ],
    paraQuien: [
      'Carwash independientes',
      'Detailing centers',
      'Talleres con servicio de lavado',
      'Gasolineras con lavado',
    ],
    ejemplos: [
      'El cliente llega, se registra la placa y entra a la cola automáticamente',
      "El empleado actualiza el estado a 'Listo' y el cajero genera la factura",
      'El dueño ve cuántos carros lavaron hoy y cuánto dinero entró',
    ],
    ctaLabel: '¿Tienes un carwash?',
  },

  repuestos: {
    slug: 'repuestos',
    nombre: 'Repuestos de Vehículos',
    emoji: '🔩',
    tagline: 'Catálogo de piezas, cotizaciones y control de inventario por referencia',
    descripcionCorta:
      'Gestiona tu inventario de repuestos con búsqueda por marca y modelo, cotizaciones y control de stock.',
    color: {
      bg: 'bg-zinc-50',
      text: 'text-zinc-600',
      ring: 'ring-zinc-200',
      badge: 'bg-zinc-100 text-zinc-700',
    },
    funciones: [
      'Búsqueda de pieza por marca, modelo y año',
      'Cotizaciones profesionales en segundos',
      'Inventario por referencia y código de pieza',
      'Reserva de piezas con control de disponibilidad',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Búsqueda inteligente',
        desc: 'Busca piezas por marca del vehículo, modelo y año de fabricación. El sistema filtra tu inventario y muestra las piezas disponibles.',
      },
      {
        titulo: 'Cotizaciones',
        desc: 'Genera cotizaciones profesionales en segundos con los precios actualizados. El cliente las recibe por WhatsApp y puede aprobarlas directamente.',
      },
      {
        titulo: 'Inventario por referencia',
        desc: 'Cada pieza tiene su referencia, código OEM y ubicación en el almacén. El stock se actualiza automáticamente con cada venta o entrada de mercancía.',
      },
      {
        titulo: 'Reserva de piezas',
        desc: 'Reserva piezas para un cliente mientras llega o mientras se pide al proveedor. El sistema controla qué está reservado y qué está disponible.',
      },
      {
        titulo: 'Órdenes de compra',
        desc: 'Cuando una pieza se agota, crea la orden de compra al proveedor desde el mismo sistema. El inventario se actualiza cuando llega la mercancía.',
      },
    ],
    paraQuien: [
      'Tiendas de repuestos',
      'Almacenes de autopartes',
      'Talleres con venta de piezas',
      'Distribuidores de repuestos',
    ],
    ejemplos: [
      'El cliente pregunta por un filtro para un Corolla 2019 — el vendedor lo encuentra en 5 segundos',
      'Se genera la cotización y el cliente la aprueba por WhatsApp',
      'Al facturar la pieza, el inventario se descuenta automáticamente',
    ],
    ctaLabel: '¿Vendes repuestos de vehículos?',
  },

  taller: {
    slug: 'taller',
    nombre: 'Taller Mecánico',
    emoji: '🔧',
    tagline: 'Órdenes de trabajo, historial por placa y facturación al cerrar',
    descripcionCorta:
      'Digitaliza las órdenes de trabajo de tu taller. Del diagnóstico a la factura, todo en un sistema.',
    color: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      ring: 'ring-slate-200',
      badge: 'bg-slate-100 text-slate-700',
    },
    funciones: [
      'Órdenes de trabajo por vehículo con diagnóstico',
      'Historial mecánico completo por placa',
      'Mano de obra y repuestos en una sola factura',
      'Estados: recibido → diagnóstico → reparación → listo',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Órdenes de trabajo',
        desc: 'Crea una orden por cada vehículo con placa, cliente, descripción de la falla y técnico asignado. Todo queda registrado y trazable.',
      },
      {
        titulo: 'Diagnóstico y seguimiento',
        desc: 'El técnico registra el diagnóstico y el trabajo realizado directamente en la orden. El cliente puede ver el progreso en tiempo real.',
      },
      {
        titulo: 'Mano de obra + repuestos',
        desc: 'Agrega los servicios realizados y los repuestos usados en la misma orden. La factura se genera con todo incluido en un solo documento.',
      },
      {
        titulo: 'Historial por placa',
        desc: 'Busca cualquier placa y ve todo el historial de servicios: fechas, diagnósticos, repuestos y montos. Información valiosa para el técnico y el cliente.',
      },
      {
        titulo: 'Facturación al cerrar',
        desc: 'Cuando el vehículo está listo, genera la factura con un clic. Acepta efectivo, tarjeta o crédito. El inventario de repuestos se descuenta automáticamente.',
      },
    ],
    paraQuien: [
      'Talleres mecánicos',
      'Talleres de colisión',
      'Talleres de frenos y suspensión',
      'Mecánicos independientes',
    ],
    ejemplos: [
      'El cliente llega, se registra la placa y se crea la orden de trabajo en 1 minuto',
      'El técnico actualiza el diagnóstico y el cliente recibe una notificación por WhatsApp',
      'Al entregar el vehículo, la factura sale con mano de obra y repuestos incluidos',
    ],
    ctaLabel: '¿Tienes un taller mecánico?',
  },

  ferreteria: {
    slug: 'ferreteria',
    nombre: 'Ferretería / Materiales de Construcción',
    emoji: '🔨',
    tagline: 'Unidades complejas, precios por volumen y crédito a constructores',
    descripcionCorta:
      'El sistema de inventario y ventas diseñado para las unidades y dinámicas de una ferretería.',
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-200',
      badge: 'bg-amber-100 text-amber-700',
    },
    funciones: [
      'Múltiples unidades de medida: metros, pies, libras, sacos',
      'Descuentos automáticos por volumen',
      'Cotizaciones de obra completas',
      'Crédito y cuenta corriente para constructores',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Unidades complejas',
        desc: 'Vende por metros, pies cuadrados, libras, sacos, rollos o lo que uses. El sistema maneja la conversión y el inventario en la unidad que elijas.',
      },
      {
        titulo: 'Precios por volumen',
        desc: 'Define precios escalonados: si lleva 10 bolsas paga X, si lleva 50 paga Y. El descuento se aplica automáticamente sin necesidad de ajuste manual.',
      },
      {
        titulo: 'Cotizaciones de obra',
        desc: 'El cliente describe el proyecto, tú agregas los materiales y el sistema genera la cotización completa en PDF. Profesional y rápido.',
      },
      {
        titulo: 'Crédito a constructores',
        desc: 'Los clientes frecuentes tienen cuenta corriente con límite de crédito. Llevan materiales y pagan al completar la obra. El historial siempre visible.',
      },
      {
        titulo: 'Lista de precios por cliente',
        desc: 'Define listas de precios diferentes: precio detalle, precio contratista, precio distribuidor. El sistema aplica el precio correcto según el cliente.',
      },
    ],
    paraQuien: [
      'Ferreterías',
      'Distribuidoras de materiales',
      'Depósitos de construcción',
      'Pinturas y acabados',
    ],
    ejemplos: [
      'El contratista pide 200 bloques — el sistema aplica el precio por volumen automáticamente',
      'Se genera la cotización de la obra y el cliente la aprueba por WhatsApp',
      'Al mes, el constructor paga su cuenta corriente con un solo pago',
    ],
    ctaLabel: '¿Tienes una ferretería?',
  },

  salon: {
    slug: 'salon',
    nombre: 'Salón de Belleza / Barbería',
    emoji: '✂️',
    tagline: 'Agenda de citas, comisiones por estilista y programa de fidelización',
    descripcionCorta:
      'Gestiona tu salón o barbería con agenda digital, comisiones automáticas y recordatorios por WhatsApp.',
    color: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      ring: 'ring-pink-200',
      badge: 'bg-pink-100 text-pink-700',
    },
    funciones: [
      'Agenda de citas por estilista o barbero',
      'Comisiones automáticas por servicio realizado',
      'Lista de espera para clientes sin cita',
      'Recordatorios automáticos por WhatsApp',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Agenda por estilista',
        desc: 'Cada estilista o barbero tiene su propia agenda. Las citas se asignan a quien corresponde sin conflictos de horario. Vista diaria, semanal o por empleado.',
      },
      {
        titulo: 'Comisiones automáticas',
        desc: 'Define el porcentaje de comisión por servicio y por estilista. El sistema calcula automáticamente cuánto le corresponde a cada uno sin hacer cuentas.',
      },
      {
        titulo: 'Lista de espera (walk-ins)',
        desc: 'Los clientes sin cita entran a la lista de espera. El sistema notifica cuando es su turno y registra el tiempo de espera real.',
      },
      {
        titulo: 'Servicios con precio propio',
        desc: 'Cada estilista puede tener sus propios precios por servicio. La factura refleja exactamente lo que se realizó y quién lo hizo.',
      },
      {
        titulo: 'Recordatorios por WhatsApp',
        desc: 'El sistema envía recordatorios automáticos 24 horas antes de cada cita. Menos no-shows, más ingresos.',
      },
      {
        titulo: 'Programa de fidelización',
        desc: 'Lleva el historial de visitas de cada cliente. Identifica a tus clientes más frecuentes y ofréceles beneficios especiales.',
      },
    ],
    paraQuien: ['Salones de belleza', 'Barberías', 'Spas', 'Centros de estética', 'Nail studios'],
    ejemplos: [
      'La cliente llama, se busca su historial y se le asigna cita con su estilista preferida en 30 segundos',
      'Al terminar el servicio, la comisión de la estilista se calcula sola',
      'El día anterior, el sistema envía recordatorio a todas las citas del día siguiente',
    ],
    ctaLabel: '¿Tienes un salón o barbería?',
  },

  clinica: {
    slug: 'clinica',
    nombre: 'Clínica / Consultorio',
    emoji: '🏥',
    tagline: 'Expedientes digitales, agenda y facturación a seguros',
    descripcionCorta:
      'Del expediente del paciente a la factura al seguro médico, todo en un sistema seguro y confidencial.',
    color: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      ring: 'ring-cyan-200',
      badge: 'bg-cyan-100 text-cyan-700',
    },
    funciones: [
      'Expediente médico digital por paciente',
      'Agenda por doctor con vista de día',
      'Recetas médicas registradas en el sistema',
      'Facturación a ARS y pagos mixtos seguro+paciente',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Expediente del paciente',
        desc: 'Cada paciente tiene su expediente con datos personales, tipo de sangre, alergias, antecedentes y seguro médico. Busca por nombre, cédula o número de expediente.',
      },
      {
        titulo: 'Historial de consultas',
        desc: 'Cada consulta queda registrada con diagnóstico, síntomas, tratamiento, receta y signos vitales. El médico tiene el historial completo en segundos.',
      },
      {
        titulo: 'Agenda médica',
        desc: 'Vista de día con todas las consultas ordenadas por hora. Navega entre fechas, asigna citas a médicos específicos y gestiona cancelaciones.',
      },
      {
        titulo: 'Recetas médicas',
        desc: 'El médico registra la receta directamente en la consulta. Queda registrada y puede imprimirse o enviarse por WhatsApp.',
      },
      {
        titulo: 'Signos vitales',
        desc: 'Registra presión arterial, peso, talla, temperatura y frecuencia cardíaca en cada consulta. El historial de signos vitales queda visible para el médico.',
      },
      {
        titulo: 'Facturación a seguros',
        desc: 'Factura al ARS con los códigos correctos. Registra el copago del paciente y el monto a cobrar al seguro por separado. Control total de cobros.',
      },
    ],
    paraQuien: [
      'Médicos generales',
      'Especialistas',
      'Clínicas privadas',
      'Consultorios dentales',
      'Veterinarias',
    ],
    ejemplos: [
      'El recepcionista busca al paciente por cédula y ve todo su historial en segundos',
      'El médico registra el diagnóstico, la receta y los signos vitales en la misma consulta',
      'La factura se genera con el copago del paciente y el monto al seguro separados',
    ],
    ctaLabel: '¿Tienes una clínica o consultorio?',
  },

  inmobiliaria: {
    slug: 'inmobiliaria',
    nombre: 'Inmobiliaria',
    emoji: '🏠',
    tagline: 'Contratos de alquiler y cobros de renta digitalizados',
    descripcionCorta:
      'Administra tu cartera de propiedades, contratos de alquiler y cobros mensuales desde un solo lugar.',
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    funciones: [
      'Catálogo de propiedades con tipo y estado',
      'Contratos de alquiler con fecha y monto',
      'Cobro recurrente mensual con historial',
      'Alertas de contratos por vencer',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Catálogo de propiedades',
        desc: 'Registra cada inmueble con código, tipo (apartamento, local, casa), dirección, habitaciones, metros cuadrados y precio. Filtra por estado: disponible, alquilada, en venta.',
      },
      {
        titulo: 'Contratos de alquiler',
        desc: "Crea contratos con datos del inquilino, fecha de inicio y fin, monto mensual y depósito. Al crear el contrato, la propiedad cambia automáticamente a estado 'Alquilada'.",
      },
      {
        titulo: 'Control de pagos mensuales',
        desc: 'Registra los pagos por mes con un clic. El sistema detecta si un mes ya fue pagado para evitar duplicados. Ve el total cobrado por período.',
      },
      {
        titulo: 'Alertas de vencimiento',
        desc: 'El sistema alerta los contratos que vencen en los próximos 30 días para que puedas renovar o liberar la propiedad a tiempo.',
      },
      {
        titulo: 'Gestión de propietarios e inquilinos',
        desc: 'Lleva el historial completo de cada inquilino: pagos, atrasos, contratos anteriores. Información siempre disponible para tomar decisiones.',
      },
    ],
    paraQuien: [
      'Empresas inmobiliarias',
      'Propietarios con múltiples inmuebles',
      'Administradores de edificios',
      'Agentes de bienes raíces',
    ],
    ejemplos: [
      "El administrador crea el contrato del Apto 2B y la propiedad pasa automáticamente a 'Alquilada'",
      'A fin de mes, registra todos los pagos de renta en minutos',
      'El sistema alerta que 3 contratos vencen este mes con tiempo para renovar',
    ],
    ctaLabel: '¿Administras propiedades?',
  },

  farmacia: {
    slug: 'farmacia',
    nombre: 'Farmacia',
    emoji: '💊',
    tagline: 'Control de vencimientos, lotes y medicamentos controlados',
    descripcionCorta:
      'Sistema especializado para farmacias, con control de vencimientos crítico, lotes y facturación a ARS.',
    color: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      ring: 'ring-green-200',
      badge: 'bg-green-100 text-green-700',
    },
    funciones: [
      'Control de vencimientos con alertas automáticas',
      'Número de lote y registro sanitario por medicamento',
      'Medicamentos controlados con receta obligatoria',
      'Facturación a ARS y genéricos vs marca',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Control de vencimientos',
        desc: 'Cada medicamento tiene su fecha de vencimiento registrada. El sistema genera alertas 30, 60 y 90 días antes para que puedas rotarlos o devolverlos al proveedor.',
      },
      {
        titulo: 'Control por lote',
        desc: 'Registra el número de lote y registro sanitario de cada medicamento. Si hay una alerta sanitaria, puedes identificar exactamente qué lotes tienes en inventario.',
      },
      {
        titulo: 'Medicamentos controlados',
        desc: 'Los medicamentos que requieren receta médica están marcados en el sistema. El dispensador debe registrar el número de receta antes de procesar la venta.',
      },
      {
        titulo: 'Genéricos vs marca',
        desc: 'Identifica fácilmente cuáles productos son genéricos y cuáles son de marca. Ayuda al dispensador a ofrecer alternativas cuando el médico lo permite.',
      },
      {
        titulo: 'Facturación a ARS',
        desc: 'Registra las ventas cubiertas por seguro médico con el código del ARS correspondiente. Control de copagos y reclamaciones al seguro.',
      },
    ],
    paraQuien: [
      'Farmacias independientes',
      'Cadenas de farmacias',
      'Boticas comunitarias',
      'Farmacias hospitalarias',
    ],
    ejemplos: [
      'El sistema alerta que la amoxicilina del lote L-2024 vence en 45 días',
      'El cliente presenta su tarjeta del seguro y la venta se factura al ARS automáticamente',
      'Se busca un medicamento controlado y el sistema pide el número de receta antes de vender',
    ],
    ctaLabel: '¿Tienes una farmacia?',
  },

  tienda_ropa: {
    slug: 'tienda_ropa',
    nombre: 'Tienda de Ropa / Variedades',
    emoji: '👗',
    tagline: 'Variantes por talla y color, promociones y control de devoluciones',
    descripcionCorta:
      'Sistema de inventario y ventas para tiendas de ropa con variantes, etiquetas de precio y promociones.',
    color: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-200',
      badge: 'bg-purple-100 text-purple-700',
    },
    funciones: [
      'Variantes por talla y color por producto',
      'Promociones: 2x1, porcentaje, monto fijo',
      'Gestión de devoluciones e intercambios',
      'Impresión de etiquetas de precio con SKU',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Variantes por talla y color',
        desc: 'Cada prenda tiene sus variantes configuradas: S/M/L/XL en rojo, azul y negro. El inventario se lleva por variante y el POS muestra cuáles están disponibles.',
      },
      {
        titulo: 'SKU por variante',
        desc: 'Cada combinación talla-color tiene su propio SKU. Facilita el conteo físico, la recepción de mercancía y la búsqueda rápida en el POS.',
      },
      {
        titulo: 'Promociones automáticas',
        desc: 'Configura promociones de 2x1, descuento por porcentaje o precio especial por temporada. El sistema las aplica automáticamente en el POS durante las fechas configuradas.',
      },
      {
        titulo: 'Devoluciones e intercambios',
        desc: 'Registra devoluciones con motivo y devuelve el monto al cliente o genera un crédito para una próxima compra. El inventario se actualiza automáticamente.',
      },
      {
        titulo: 'Etiquetas de precio',
        desc: 'Imprime etiquetas con código de barras, talla, color, SKU y precio. Conecta con impresoras de etiquetas térmicas estándar.',
      },
    ],
    paraQuien: [
      'Tiendas de ropa',
      'Boutiques',
      'Zapaterías',
      'Tiendas de variedades',
      'Multimarcas',
    ],
    ejemplos: [
      'El cliente quiere la camisa azul talla M — el sistema muestra al instante si hay disponibilidad',
      'Se activa la promoción de fin de semana y el POS aplica el 20% automáticamente',
      'El cliente devuelve una prenda y se le genera un crédito para su próxima compra',
    ],
    ctaLabel: '¿Tienes una tienda de ropa?',
  },

  tienda_online: {
    slug: 'tienda_online',
    nombre: 'Tienda Online / Ventas por DM',
    emoji: '📱',
    tagline: 'Pedidos por DM, link de pago por WhatsApp y catálogo compartible',
    descripcionCorta:
      'Gestiona tus pedidos de redes sociales con un sistema ordenado. Del DM a la entrega, todo registrado.',
    color: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      ring: 'ring-indigo-200',
      badge: 'bg-indigo-100 text-indigo-700',
    },
    funciones: [
      'Registro de pedidos recibidos por DM o WhatsApp',
      'Link de pago compartible por WhatsApp',
      'Seguimiento de pedido hasta la entrega',
      'Catálogo público compartible con clientes',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Gestión de pedidos por DM',
        desc: 'Registra cada pedido que llega por Instagram, Facebook o WhatsApp. Asigna cliente, productos, monto y forma de pago. Todo ordenado en un solo lugar.',
      },
      {
        titulo: 'Link de pago por WhatsApp',
        desc: 'Genera un link de pago que puedes compartir directamente por WhatsApp. El cliente paga en línea y el sistema actualiza el estado del pedido automáticamente.',
      },
      {
        titulo: 'Estados de pedido',
        desc: 'Cada pedido pasa por estados: Pendiente → Confirmado → Preparando → Enviado → Entregado. El cliente siempre sabe dónde está su pedido.',
      },
      {
        titulo: 'Número de tracking',
        desc: 'Cuando el pedido sale con mensajería, registra el número de tracking. El cliente puede consultarlo desde el sistema.',
      },
      {
        titulo: 'Catálogo compartible',
        desc: 'Crea un catálogo digital de tus productos con fotos, descripción y precios. Comparte el link por WhatsApp e Instagram. Los clientes ven lo disponible antes de escribirte.',
      },
    ],
    paraQuien: [
      'Tiendas en redes sociales',
      'Negocios por WhatsApp',
      'Emprendedores digitales',
      'Revendedores',
    ],
    ejemplos: [
      'El cliente escribe por Instagram, se registra el pedido y se le envía el link de pago en 1 minuto',
      'El pedido pasa a "Enviado" y el cliente recibe el número de tracking automáticamente',
      'El dueño ve todas las órdenes del día en un solo panel sin revisar cada chat',
    ],
    ctaLabel: '¿Vendes por redes sociales o WhatsApp?',
  },

  joyeria: {
    slug: 'joyeria',
    nombre: 'Joyería',
    emoji: '💍',
    tagline: 'Inventario por pieza única, reparaciones y apartado con depósito',
    descripcionCorta:
      'Sistema especializado para joyerías con inventario por número de serie, reparaciones y apartados.',
    color: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      ring: 'ring-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    funciones: [
      'Inventario por pieza única con número de serie',
      'Descripción de material, quilates y peso',
      'Sistema de apartado con depósito',
      'Gestión de reparaciones por cliente',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Inventario por pieza única',
        desc: 'Cada joya tiene su número de serie único con descripción de material, quilates, peso en gramos y precio. Nunca pierdes el rastro de ninguna pieza.',
      },
      {
        titulo: 'Apartado con depósito',
        desc: 'El cliente aparta una joya dejando un depósito. El sistema registra el monto, la fecha límite y descuenta automáticamente al completar la compra.',
      },
      {
        titulo: 'Reparaciones',
        desc: 'Crea un expediente por cada joya que entra a reparación. Registra descripción del trabajo, presupuesto, fecha promesa y costo final. La factura sale al entregar.',
      },
      {
        titulo: 'Precio referenciado al oro',
        desc: 'Marca el precio base según el tipo de material. Cuando el precio del oro cambia, puedes actualizar los precios de las piezas en lote.',
      },
      {
        titulo: 'Historial por cliente',
        desc: 'Ve todas las compras, apartados y reparaciones de un cliente en un solo lugar. Información valiosa para ofrecer un servicio personalizado.',
      },
    ],
    paraQuien: [
      'Joyerías y orfebres',
      'Relojeros con reparación',
      'Vendedores de joyas',
      'Ópticas con joyería',
    ],
    ejemplos: [
      'Una cliente aparta un anillo dejando el depósito — queda registrado con fecha límite',
      'El joyero marca la reparación como "Lista" y genera la factura con un clic',
      'Se busca la historia de una clienta y aparecen todas sus compras y reparaciones anteriores',
    ],
    ctaLabel: '¿Tienes una joyería?',
  },

  supermercado: {
    slug: 'supermercado',
    nombre: 'Supermercado / Minimarket Grande',
    emoji: '🏪',
    tagline: 'Departamentos, ofertas automáticas y precios por volumen',
    descripcionCorta:
      'Para operaciones de mayor escala: departamentos organizados, ofertas con vigencia automática y precios mayoristas.',
    color: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      ring: 'ring-teal-200',
      badge: 'bg-teal-100 text-teal-700',
    },
    funciones: [
      'Departamentos y categorías organizadas',
      'Ofertas con fecha de inicio y fin automáticas',
      'Precios por volumen para mayoristas',
      'Control de inventario multi-producto',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Departamentos y categorías',
        desc: 'Organiza tu catálogo por secciones: Lácteos, Carnes, Bebidas, Limpieza. Con categorías anidadas para una vista clara del inventario.',
      },
      {
        titulo: 'Ofertas automáticas',
        desc: 'Programa ofertas con fecha de inicio y fin. El sistema las activa y vence solo, sin intervención manual. Las activas se aplican automáticamente en el POS.',
      },
      {
        titulo: 'Precios por volumen',
        desc: 'Define precios escalonados para mayoristas: si lleva 6 unidades paga X, si lleva 12 paga Y. El precio correcto se aplica automáticamente.',
      },
      {
        titulo: 'Inventario de alto volumen',
        desc: 'Maneja cientos de productos con SKU, código de barras y múltiples unidades de medida. El stock se descuenta automáticamente con cada venta.',
      },
    ],
    paraQuien: [
      'Supermercados medianos',
      'Minimarkets grandes',
      'Distribuidoras',
      'Colmados grandes',
    ],
    ejemplos: [
      'El cajero escanea el código y el sistema aplica el precio de oferta vigente automáticamente',
      'Un mayorista compra 24 unidades y el precio por volumen se aplica sin ajuste manual',
      'El gerente programa las ofertas del fin de semana el lunes — el sistema las activa solo',
    ],
    ctaLabel: '¿Tienes un supermercado o minimarket?',
  },
};

export const VERTICALES_LIST = (
  [
    'restaurante',
    'colmado',
    'carwash',
    'repuestos',
    'taller',
    'ferreteria',
    'salon',
    'clinica',
    'inmobiliaria',
    'farmacia',
    'tienda_ropa',
    'tienda_online',
    'joyeria',
    'supermercado',
  ] as VerticalSlug[]
).map((s) => VERTICALES[s]);
