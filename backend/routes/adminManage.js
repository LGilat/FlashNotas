const express = require("express");
const z = require("zod");
const prisma = require("../prismaClient");
const verifyAdmin = require("../middleware/verifyAdmin");
const { logAudit } = require("../utils/audit");

const router = express.Router();

// Users
router.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        _count: { select: { notas: true, categorias: true } },
      },
    });
    res.json({ ok: true, users });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al listar usuarios", error });
  }
});

router.get("/admin/users/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: { notas: true, categorias: true, roles: true },
    });
    if (!user) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al obtener usuario", error });
  }
});

router.patch("/admin/users/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    nombre: z.string().min(3).max(100),
    email: z.string().email(),
  });
  try {
    const parsed = schema.partial().safeParse(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }
    const user = await prisma.usuario.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    await logAudit({
      action: "admin_update_user",
      entity: "usuario",
      entityId: user.id,
      actorUserId: req.user.id,
      actorRole: "admin",
      details: { nombre: user.nombre, email: user.email },
    });
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al actualizar usuario", error });
  }
});

router.delete("/admin/users/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = Number(id);
    await prisma.$transaction([
      prisma.nota.deleteMany({ where: { usuarioId: userId } }),
      prisma.categoria.deleteMany({ where: { usuarioId: userId } }),
      prisma.rolUsuario.deleteMany({ where: { usuarioId: userId } }),
      prisma.usuario.delete({ where: { id: userId } }),
    ]);
    await logAudit({
      action: "admin_delete_user",
      entity: "usuario",
      entityId: userId,
      actorUserId: req.user.id,
      actorRole: "admin",
    });
    res.json({ ok: true, mensaje: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al eliminar usuario", error });
  }
});

// Categorias
router.get("/admin/categorias", verifyAdmin, async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { usuario: true },
    });
    res.json({ ok: true, categorias });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al listar categorias", error });
  }
});

router.patch("/admin/categorias/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    nombre: z.string().min(3).max(100),
    descripcion: z.string().min(3).max(100),
  });
  try {
    const parsed = schema.partial().safeParse(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }
    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    await logAudit({
      action: "admin_update_categoria",
      entity: "categoria",
      entityId: categoria.id,
      actorUserId: req.user.id,
      actorRole: "admin",
      details: { nombre: categoria.nombre },
    });
    res.json({ ok: true, categoria });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al actualizar categoria", error });
  }
});

router.delete("/admin/categorias/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const categoriaId = Number(id);
    await prisma.$transaction([
      prisma.nota.deleteMany({ where: { categoriaId } }),
      prisma.categoria.delete({ where: { id: categoriaId } }),
    ]);
    await logAudit({
      action: "admin_delete_categoria",
      entity: "categoria",
      entityId: categoriaId,
      actorUserId: req.user.id,
      actorRole: "admin",
    });
    res.json({ ok: true, mensaje: "Categoria eliminada" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al eliminar categoria", error });
  }
});

// Notas
router.get("/admin/notas", verifyAdmin, async (req, res) => {
  try {
    const notas = await prisma.nota.findMany({
      include: { usuario: true, categoria: true },
    });
    res.json({ ok: true, notas });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al listar notas", error });
  }
});

router.patch("/admin/notas/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    titulo: z.string().min(2).max(100),
    contenido: z.string().min(2).max(2000),
    categoriaId: z.number(),
  });
  try {
    const parsed = schema.partial().safeParse({
      ...req.body,
      categoriaId:
        req.body.categoriaId !== undefined ? Number(req.body.categoriaId) : undefined,
    });
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }
    if (parsed.data.categoriaId !== undefined) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: parsed.data.categoriaId },
      });
      if (!categoria) {
        return res.status(404).json({ ok: false, mensaje: "Categoria no encontrada" });
      }
    }
    const nota = await prisma.nota.update({
      where: { id: Number(id) },
      data: {
        ...parsed.data,
        fecha_ultima_modificacion: new Date(),
      },
    });
    await logAudit({
      action: "admin_update_nota",
      entity: "nota",
      entityId: nota.id,
      actorUserId: req.user.id,
      actorRole: "admin",
      details: { titulo: nota.titulo },
    });
    res.json({ ok: true, nota });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al actualizar nota", error });
  }
});

router.delete("/admin/notas/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const notaId = Number(id);
    await prisma.nota.delete({ where: { id: notaId } });
    await logAudit({
      action: "admin_delete_nota",
      entity: "nota",
      entityId: notaId,
      actorUserId: req.user.id,
      actorRole: "admin",
    });
    res.json({ ok: true, mensaje: "Nota eliminada" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al eliminar nota", error });
  }
});

// Auditoría
router.get("/admin/audit", verifyAdmin, async (req, res) => {
  try {
    const logs = await prisma.$queryRaw`
      SELECT * FROM "AuditLog"
      ORDER BY "createdAt" DESC
      LIMIT 200
    `;
    res.json({ ok: true, logs });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al obtener auditoría", error });
  }
});

// Solicitudes de rol
router.get("/admin/role-requests", verifyAdmin, async (req, res) => {
  const status = req.query.status || "pending";
  try {
    const requests = await prisma.$queryRaw`
      SELECT rr.*, u.nombre AS usuarioNombre
      FROM "RoleRequest" rr
      JOIN "Usuario" u ON u.id = rr.usuarioId
      WHERE rr.status = ${status}
      ORDER BY rr.createdAt DESC
    `;
    res.json({ ok: true, requests });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al listar solicitudes", error });
  }
});

router.patch("/admin/role-requests/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    action: z.enum(["approve", "reject"]),
  });
  try {
    const parsed = schema.safeParse(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }

    const requestRows = await prisma.$queryRaw`
      SELECT * FROM "RoleRequest" WHERE id = ${Number(id)} LIMIT 1
    `;
    const request = requestRows[0];
    if (!request) {
      return res.status(404).json({ ok: false, mensaje: "Solicitud no encontrada" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ ok: false, mensaje: "Solicitud ya resuelta" });
    }

    if (parsed.data.action === "approve") {
      let role = await prisma.rol.findFirst({ where: { rol: request.role } });
      if (!role) {
        role = await prisma.rol.create({
          data: { rol: request.role, descripcion: `Rol ${request.role}` },
        });
      }
      const existingRole = await prisma.rolUsuario.findUnique({
        where: {
          usuarioId_rolId: {
            usuarioId: request.usuarioId,
            rolId: role.id,
          },
        },
      });
      if (!existingRole) {
        await prisma.rolUsuario.create({
          data: { usuarioId: request.usuarioId, rolId: role.id },
        });
      }
    }

    const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";
    await prisma.$executeRaw`
      UPDATE "RoleRequest"
      SET "status" = ${newStatus}, "decidedAt" = ${new Date()}, "decidedById" = ${req.user.id}
      WHERE id = ${request.id}
    `;
    const updatedRows = await prisma.$queryRaw`
      SELECT * FROM "RoleRequest" WHERE id = ${request.id} LIMIT 1
    `;
    const updated = updatedRows[0];

    await logAudit({
      action: `role_request_${parsed.data.action}`,
      entity: "role_request",
      entityId: updated.id,
      actorUserId: req.user.id,
      actorRole: "admin",
      details: { role: updated.role, userId: updated.usuarioId },
    });

    res.json({ ok: true, request: updated });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al resolver solicitud", error });
  }
});

router.get("/admin/audit.csv", verifyAdmin, async (req, res) => {
  try {
    const logs = await prisma.$queryRaw`
      SELECT * FROM "AuditLog"
      ORDER BY "createdAt" DESC
      LIMIT 1000
    `;
    const header = "id,action,entity,entityId,actorUserId,actorRole,details,createdAt";
    const rows = logs.map((l) => [
      l.id,
      l.action,
      l.entity,
      l.entityId ?? "",
      l.actorUserId ?? "",
      l.actorRole ?? "",
      l.details ? l.details.replace(/"/g, '""') : "",
      l.createdAt.toISOString(),
    ].map((v) => `"${v}"`).join(","));
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit.csv\"");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al exportar auditoría", error });
  }
});

module.exports = router;
