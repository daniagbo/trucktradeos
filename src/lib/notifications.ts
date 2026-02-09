import 'server-only';
import { db } from '@/lib/db';
import type { NotificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

export async function createNotification(input: NotifyInput) {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        dedupeKey: input.dedupeKey,
      },
    });
  } catch (error) {
    // Ignore unique dedupe conflicts.
    if (input.dedupeKey) return;
    console.error('Failed to create notification:', error);
  }
}

export async function createAdminNotification(input: Omit<NotifyInput, 'userId'>) {
  const admins = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        ...input,
        userId: admin.id,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin.id}` : undefined,
      })
    )
  );
}

export async function runSlaReminderSweep() {
  const admins = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  if (admins.length === 0) return { created: 0 };

  const openRfqs = await db.rFQ.findMany({
    where: {
      status: { notIn: ['WON', 'LOST'] },
    },
    include: {
      offers: {
        where: { status: 'SENT' },
        select: { id: true },
      },
    },
  });

  const now = Date.now();
  let created = 0;

  for (const rfq of openRfqs) {
    const targetHours = rfq.slaTargetHours || 72;
    const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
    if (rfq.offers.length > 0 || ageHours < targetHours) continue;

    const dayStamp = new Date().toISOString().slice(0, 10);
    const overdueThreshold = targetHours * 2;
    const urgency = ageHours >= overdueThreshold ? 'High' : 'Medium';
    const title = ageHours >= overdueThreshold ? 'RFQ overdue for offer' : 'RFQ nearing SLA breach';
    const message = `RFQ ${rfq.id.slice(0, 10)} has no offer after ${Math.floor(ageHours)}h (target ${targetHours}h).`;

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: 'SLA',
          title,
          message,
          metadata: {
            rfqId: rfq.id,
            ageHours: Math.floor(ageHours),
            targetHours,
            urgency,
          },
          dedupeKey: `sla:${dayStamp}:${rfq.id}:${admin.id}`,
        })
      )
    );
    created += admins.length;
  }

  return { created };
}
