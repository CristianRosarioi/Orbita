/**
 * Webhook de Clerk — sincroniza usuarios con la base de datos de Órbita.
 *
 * CONFIGURACIÓN EN EL DASHBOARD DE CLERK:
 * 1. Ir a Configure > Webhooks > Add Endpoint
 * 2. URL: https://[tu-dominio]/api/webhooks/clerk
 *    En desarrollo: usar ngrok o similar → https://xxxx.ngrok.io/api/webhooks/clerk
 * 3. Suscribirse a los eventos: user.created, user.updated, user.deleted
 * 4. Copiar el "Signing Secret" y guardarlo en CLERK_WEBHOOK_SECRET en .env.local
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

// Tipos de eventos de Clerk que manejamos
interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  phone_numbers: Array<{ phone_number: string }>;
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: ClerkUserData & { id?: string };
}

function getPrimaryEmail(data: ClerkUserData): string {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? '';
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook Clerk] CLERK_WEBHOOK_SECRET no está configurado');
    return NextResponse.json({ error: 'Webhook no configurado correctamente' }, { status: 500 });
  }

  // Verificar la firma del webhook usando svix
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Headers de verificación faltantes' }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    // No loggear el payload completo — puede contener datos sensibles
    return NextResponse.json({ error: 'Firma del webhook inválida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'user.created': {
        const data = event.data;
        const email = getPrimaryEmail(data);

        await prisma.usuario.create({
          data: {
            clerkId: data.id,
            email,
            nombre: data.first_name ?? null,
            apellido: data.last_name ?? null,
            avatar: data.image_url ?? null,
            telefono: data.phone_numbers[0]?.phone_number ?? null,
          },
        });
        break;
      }

      case 'user.updated': {
        const data = event.data;
        const email = getPrimaryEmail(data);

        await prisma.usuario.updateMany({
          where: { clerkId: data.id, deletedAt: null },
          data: {
            email,
            nombre: data.first_name ?? null,
            apellido: data.last_name ?? null,
            avatar: data.image_url ?? null,
          },
        });
        break;
      }

      case 'user.deleted': {
        // Soft delete — nunca borrar datos fiscales del usuario
        const clerkId = event.data.id;
        if (clerkId) {
          await prisma.usuario.updateMany({
            where: { clerkId, deletedAt: null },
            data: { deletedAt: new Date() },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // No loggear datos del usuario — solo el tipo de evento y error genérico
    console.error('[Webhook Clerk] Error procesando evento', {
      tipo: event.type,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
    return NextResponse.json({ error: 'Error interno al procesar el evento' }, { status: 500 });
  }
}
