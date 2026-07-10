const prisma = require("../prismaClient");

const logAudit = async ({
  action,
  entity,
  entityId = null,
  actorUserId = null,
  actorRole = null,
  details = null,
}) => {
  try {
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" ("action","entity","entityId","actorUserId","actorRole","details")
      VALUES (${action}, ${entity}, ${entityId}, ${actorUserId}, ${actorRole}, ${details ? JSON.stringify(details) : null})
    `;
  } catch (error) {
    // No romper flujo principal por fallas de auditoría
    console.error("Audit log error:", error);
  }
};

module.exports = { logAudit };
