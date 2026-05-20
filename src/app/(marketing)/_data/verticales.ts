export type VerticalSlug =
  | 'restaurante'
  | 'colmado'
  | 'taller'
  | 'salon'
  | 'farmacia'
  | 'ferreteria';

export interface VerticalData {
  slug: VerticalSlug;
  nombre: string;
  emoji: string;
  tagline: string;
  descripcionCorta: string;
  descripcionLarga: string;
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
    nombre: 'Restaurante',
    emoji: '🍽️',
    tagline: 'De la comanda a la factura, sin papeles',
    descripcionCorta: 'Gestiona mesas, pedidos y facturación en un solo lugar.',
    descripcionLarga:
      'Órbita transforma la operación de tu restaurante digitalizando todo el flujo: desde que el cliente se sienta hasta que paga la cuenta. Tus meseros toman pedidos en el sistema, la cocina los ve en tiempo real, y la factura sale en segundos.',
    color: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-200',
      badge: 'bg-orange-100 text-orange-700',
    },
    funciones: [
      'Control de mesas con estados en tiempo real',
      'Comandas digitales para meseros',
      'Vista de cocina tipo kanban',
      'Facturación directa desde la mesa',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Mesas en tiempo real',
        desc: 'Visualiza el estado de todas las mesas: disponible, ocupada o reservada. Actualización instantánea sin recargar la página.',
      },
      {
        titulo: 'Comandas digitales',
        desc: 'Tus meseros toman los pedidos directamente en el sistema. No más papeles perdidos ni malos entendidos con la cocina.',
      },
      {
        titulo: 'Vista de cocina',
        desc: 'La cocina tiene su propia pantalla con los pedidos organizados por estado. Kanban estilo restaurante profesional.',
      },
      {
        titulo: 'Facturación directa',
        desc: 'Al cerrar la comanda, genera la factura en segundos. Acepta efectivo, tarjeta o crédito. Imprime o envía por WhatsApp.',
      },
    ],
    paraQuien: ['Restaurantes familiares', 'Cafeterías', 'Food courts', 'Comedores corporativos'],
    ejemplos: [
      'El mesero toma el pedido en su tablet, la cocina lo ve en 2 segundos',
      'El cliente pide la cuenta, el cajero la genera en el sistema sin buscar papeles',
      'El dueño ve las ventas del día desde su celular aunque no esté en el local',
    ],
    ctaLabel: '¿Tienes un restaurante?',
  },

  colmado: {
    slug: 'colmado',
    nombre: 'Colmado / Tienda',
    emoji: '🏪',
    tagline: 'POS rápido y fiado controlado',
    descripcionCorta: 'Vende rápido, controla el inventario y lleva el fiado sin errores.',
    descripcionLarga:
      'Órbita para colmados y tiendas te da un punto de venta ultra rápido, control de inventario en tiempo real y el módulo de fiado para llevar las cuentas de tus clientes habituales sin libretas ni confusiones.',
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    funciones: [
      'POS rápido con búsqueda por nombre',
      'Fiado con límite de crédito por cliente',
      'Control de inventario en tiempo real',
      'Cierre de caja con resumen del turno',
    ],
    funccionesDetalladas: [
      {
        titulo: 'POS ultrarrápido',
        desc: 'Busca productos por nombre o código de barras. Vende en segundos sin complicaciones. Diseñado para el ritmo de un colmado.',
      },
      {
        titulo: 'Control de fiado',
        desc: 'Lleva el fiado de cada cliente con límite de crédito e historial de movimientos. Nunca más perder el rastro de quién te debe.',
      },
      {
        titulo: 'Inventario automático',
        desc: 'Cada venta descuenta del inventario automáticamente. Alertas cuando un producto baja del mínimo.',
      },
      {
        titulo: 'Cierre de caja',
        desc: 'Al final del turno, el cajero declara el efectivo. El sistema calcula la diferencia y genera el reporte del día.',
      },
    ],
    paraQuien: ['Colmados', 'Tiendas de barrio', 'Abarroterías', 'Tiendas de conveniencia'],
    ejemplos: [
      'El cajero vende 50 productos en 15 minutos sin equivocarse',
      'El cliente regular pide fiado y el sistema ya sabe su límite de crédito',
      'El dueño ve el inventario actualizado desde su celular',
    ],
    ctaLabel: '¿Tienes un colmado o tienda?',
  },

  taller: {
    slug: 'taller',
    nombre: 'Taller Mecánico',
    emoji: '🔧',
    tagline: 'Órdenes de trabajo digitales, sin papeles',
    descripcionCorta: 'Controla las órdenes de trabajo, el historial de vehículos y factura al instante.',
    descripcionLarga:
      'Órbita para talleres mecánicos digitaliza todo el proceso: desde que el cliente trae el vehículo hasta que sale con la factura. Historial completo por placa, control de repuestos y servicios, y facturación en un click.',
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-200',
      badge: 'bg-blue-100 text-blue-700',
    },
    funciones: [
      'Órdenes de trabajo por vehículo',
      'Historial completo por placa',
      'Control de repuestos y servicios',
      'Facturación al cerrar la orden',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Órdenes de trabajo',
        desc: 'Crea una orden cuando entra el vehículo. Registra la falla, el diagnóstico, el técnico asignado y la fecha prometida.',
      },
      {
        titulo: 'Historial por placa',
        desc: 'Busca cualquier placa y ve todo el historial: qué le hicieron, cuándo vino, cuánto costó. Información al instante.',
      },
      {
        titulo: 'Control de repuestos',
        desc: 'Agrega repuestos y servicios a la orden con precio y cantidad. El sistema calcula el total con o sin ITBIS.',
      },
      {
        titulo: 'Facturación directa',
        desc: 'Al cerrar la orden, genera la factura en segundos. El vehículo entregado, el cliente pagando. Así de simple.',
      },
    ],
    paraQuien: ['Talleres mecánicos', 'Carwash con servicios', 'Tiendas de repuestos', 'Servitecas'],
    ejemplos: [
      'El mecánico ve la lista de órdenes pendientes y cuáles están listas para entregar',
      'El cliente pregunta por su carro y el recepcionista busca la placa en segundos',
      'Al entregar el vehículo, la factura ya está lista con todos los servicios',
    ],
    ctaLabel: '¿Tienes un taller mecánico?',
  },

  salon: {
    slug: 'salon',
    nombre: 'Salón de Belleza',
    emoji: '✂️',
    tagline: 'Agenda digital, sin blocs de papel',
    descripcionCorta: 'Gestiona citas, estilistas y servicios con una agenda visual clara.',
    descripcionLarga:
      'Órbita para salones de belleza y barberías te da una agenda visual por hora, gestión de citas por estilista, y facturación al completar el servicio. Nunca más perder una cita por no tener el bloc a mano.',
    color: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      ring: 'ring-pink-200',
      badge: 'bg-pink-100 text-pink-700',
    },
    funciones: [
      'Agenda visual de citas por hora',
      'Gestión de estilistas y servicios',
      'Estados de cita en tiempo real',
      'Facturación al completar el servicio',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Agenda visual',
        desc: 'Vista de todas las citas del día ordenadas por hora. Sabe de un vistazo quién viene, a qué hora y con quién.',
      },
      {
        titulo: 'Gestión de citas',
        desc: 'Crea, modifica y cancela citas fácilmente. Asigna el servicio, el estilista y el precio. Estados en tiempo real.',
      },
      {
        titulo: 'Servicios y estilistas',
        desc: 'Define tus servicios con precio y duración. Asigna las citas al estilista disponible. Seguimiento individual.',
      },
      {
        titulo: 'Cobro al finalizar',
        desc: 'Al marcar la cita como completada, genera la factura en segundos. El cliente paga y sale. Sin papeleo.',
      },
    ],
    paraQuien: ['Salones de belleza', 'Barberías', 'Spas', 'Centros de estética'],
    ejemplos: [
      'La recepcionista ve todas las citas del día y asigna la próxima en segundos',
      'El cliente llega, se le marca como "en proceso" y el estilista lo sabe al instante',
      'Al terminar el servicio, la factura sale en un click',
    ],
    ctaLabel: '¿Tienes un salón o barbería?',
  },

  farmacia: {
    slug: 'farmacia',
    nombre: 'Farmacia / Botica',
    emoji: '💊',
    tagline: 'Lotes, vencimientos y stock bajo control',
    descripcionCorta: 'Controla los lotes de medicamentos, los vencimientos y el inventario.',
    descripcionLarga:
      'Órbita para farmacias te da control completo de los lotes de medicamentos: número de lote, fecha de vencimiento, cantidad disponible y alertas automáticas antes de que venzan.',
    color: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      ring: 'ring-teal-200',
      badge: 'bg-teal-100 text-teal-700',
    },
    funciones: [
      'Control de lotes por medicamento',
      'Alertas de productos por vencer',
      'Gestión de vencimientos automática',
      'Control de stock por lote y producto',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Control de lotes',
        desc: 'Registra cada lote con número, fecha de vencimiento, cantidad y proveedor. Trazabilidad completa del medicamento.',
      },
      {
        titulo: 'Alertas de vencimiento',
        desc: 'Órbita te avisa automáticamente cuando un lote está próximo a vencer (30, 60 o 90 días). Nunca venderás un medicamento vencido.',
      },
      {
        titulo: 'Inventario por producto',
        desc: 'Ve el stock de cada medicamento agrupado por lotes. Sabe exactamente cuánto tienes y cuándo vence cada uno.',
      },
      {
        titulo: 'Gestión de entradas',
        desc: 'Al recibir un pedido, registra el nuevo lote con toda su información. El inventario se actualiza automáticamente.',
      },
    ],
    paraQuien: ['Farmacias', 'Boticas', 'Droguerías', 'Farmacias de hospital'],
    ejemplos: [
      'El farmacéutico busca un medicamento y ve todos los lotes disponibles con sus fechas',
      'El sistema avisa que el Paracetamol lote L2024-001 vence en 15 días',
      'El comprador ve cuándo vence el próximo lote antes de hacer el pedido',
    ],
    ctaLabel: '¿Tienes una farmacia?',
  },

  ferreteria: {
    slug: 'ferreteria',
    nombre: 'Ferretería',
    emoji: '🔨',
    tagline: 'Pedidos a proveedores y stock controlado',
    descripcionCorta: 'Gestiona pedidos a proveedores con unidades de medida de ferretería.',
    descripcionLarga:
      'Órbita para ferreterías te da un sistema de pedidos a proveedores con soporte para todas las unidades del sector: sacos, galones, metros cuadrados, varillas y más. Control de stock y seguimiento de órdenes de compra.',
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-200',
      badge: 'bg-amber-100 text-amber-700',
    },
    funciones: [
      'Pedidos a proveedores digitales',
      'Múltiples unidades de medida',
      'Control de stock por producto',
      'Seguimiento del estado del pedido',
    ],
    funccionesDetalladas: [
      {
        titulo: 'Pedidos a proveedores',
        desc: 'Crea pedidos de compra a tus proveedores con detalle de productos, cantidades y precios. Seguimiento desde Borrador hasta Recibido.',
      },
      {
        titulo: 'Unidades de ferretería',
        desc: 'Trabaja con sacos, galones, m², m³, kg, varillas, rollos y más. El sistema soporta todas las unidades del sector.',
      },
      {
        titulo: 'Control de inventario',
        desc: 'Ve el stock actualizado de cada producto. Sabe cuándo pedir más antes de que se agote. Historial de movimientos.',
      },
      {
        titulo: 'Estados de pedido',
        desc: 'Borrador → Enviado → Confirmado → Recibido. Control total del proceso de compra con tu proveedor.',
      },
    ],
    paraQuien: ['Ferreterías', 'Distribuidoras de materiales', 'Tiendas de pinturas', 'Constructores'],
    ejemplos: [
      'El encargado crea un pedido de 200 sacos de cemento al proveedor desde el sistema',
      'Al llegar el pedido, lo marca como recibido y el inventario se actualiza',
      'El vendedor sabe exactamente cuántos galones de pintura quedan en almacén',
    ],
    ctaLabel: '¿Tienes una ferretería?',
  },
};

export const VERTICALES_LIST = Object.values(VERTICALES);
