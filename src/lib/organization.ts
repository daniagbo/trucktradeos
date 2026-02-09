import { db } from '@/lib/db';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'organization';
}

export async function ensureUserOrganization(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
      accountType: true,
      companyName: true,
      name: true,
      teamRole: true,
    },
  });
  if (!user) return null;
  if (user.organizationId) return user.organizationId;
  if (user.accountType !== 'COMPANY') return null;

  const baseName = (user.companyName && user.companyName.trim()) || `${user.name.trim()} Organization`;
  const baseSlug = slugify(baseName);

  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const organization = await db.organization.create({
    data: { name: baseName, slug },
    select: { id: true },
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      organizationId: organization.id,
      teamRole: user.teamRole === 'REQUESTER' ? 'OWNER' : user.teamRole,
    },
  });

  await db.approvalPolicy.createMany({
    data: [
      {
        organizationId: organization.id,
        serviceTier: 'STANDARD',
        requiredApprovals: 1,
        approverTeamRole: 'APPROVER',
        autoAssignEnabled: true,
        warningThresholdRatio: 1,
        criticalThresholdRatio: 1.5,
        active: true,
      },
      {
        organizationId: organization.id,
        serviceTier: 'PRIORITY',
        requiredApprovals: 1,
        approverTeamRole: 'MANAGER',
        autoAssignEnabled: true,
        warningThresholdRatio: 1,
        criticalThresholdRatio: 1.5,
        active: true,
      },
      {
        organizationId: organization.id,
        serviceTier: 'ENTERPRISE',
        requiredApprovals: 2,
        approverTeamRole: 'OWNER',
        autoAssignEnabled: true,
        warningThresholdRatio: 1,
        criticalThresholdRatio: 1.5,
        active: true,
      },
    ],
  });

  return organization.id;
}
