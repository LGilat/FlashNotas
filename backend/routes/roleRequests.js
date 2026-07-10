const express = require("express");
const z = require("zod");
const prisma = require("../prismaClient");
const verifyToken = require("../middleware/verifyToken");
const { logAudit } = require("../utils/audit");

const router = express.Router();

router.post("/role-requests", verifyToken, async (req, res) => {
  const schema = z.object({
    role: z.string().min(3).max(100),
    reason: z.string().max(500).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }

    const roleName = parsed.data.role;
    const alreadyHasRole = await prisma.rolUsuario.findFirst({
      where: {
        usuarioId: req.user.id,
        rol: { rol: roleName },
      },
    });
    if (alreadyHasRole) {
      return res.status(400).json({ ok: false, mensaje: "Ya tienes este rol" });
    }

    const existingPending = await prisma.$queryRaw`
      SELECT "id" FROM "RoleRequest"
      WHERE "usuarioId" = ${req.user.id} AND "role" = ${roleName} AND "status" = 'pending'
      LIMIT 1
    `;
    if (existingPending.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "Ya tienes una solicitud pendiente" });
    }

    await prisma.$executeRaw`
      INSERT INTO "RoleRequest" ("role","status","reason","usuarioId")
      VALUES (${roleName}, 'pending', ${parsed.data.reason || null}, ${req.user.id})
    `;

    const request = await prisma.$queryRaw`
      SELECT * FROM "RoleRequest"
      WHERE "usuarioId" = ${req.user.id} AND "role" = ${roleName}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    await logAudit({
      action: "role_request_create",
      entity: "role_request",
      entityId: request?.[0]?.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { role: roleName },
    });

    res.json({ ok: true, request: request[0] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al crear solicitud", error });
  }
});

router.get("/role-requests", verifyToken, async (req, res) => {
  try {
    const requests = await prisma.$queryRaw`
      SELECT * FROM "RoleRequest"
      WHERE "usuarioId" = ${req.user.id}
      ORDER BY "createdAt" DESC
    `;
    res.json({ ok: true, requests });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al obtener solicitudes", error });
  }
});

module.exports = router;
