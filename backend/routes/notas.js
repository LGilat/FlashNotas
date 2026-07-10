const express = require("express");
const z = require("zod");
const prisma = require("../prismaClient");
const verifyToken = require("../middleware/verifyToken");
const { logAudit } = require("../utils/audit");

const router = express.Router();

const userHasRole = async (userId, roleName) => {
  const role = await prisma.rol.findFirst({ where: { rol: roleName } });
  if (!role) return false;
  const hasRole = await prisma.rolUsuario.findUnique({
    where: {
      usuarioId_rolId: {
        usuarioId: userId,
        rolId: role.id,
      },
    },
  });
  return !!hasRole;
};

router.post("/note", verifyToken, async (req, res) => {
  const noteschema = z.object({
    titulo: z.string().min(2).max(100),
    contenido: z.string().min(2).max(2000),
    fecha_creacion: z.string(),
    categoriaId: z.number(),
    tags: z.string().max(500).optional(),
    pinned: z.boolean().optional(),
    favorite: z.boolean().optional(),
  });

  try {
    const parsed = noteschema.safeParse({
      ...req.body,
      categoriaId: Number(req.body.categoriaId),
    });
    if (parsed.error) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error en los datos",
        error: parsed.error.message,
      });
    }

    const categoria = await prisma.categoria.findFirst({
      where: {
        id: parsed.data.categoriaId,
        usuarioId: req.user.id,
      },
    });
    if (!categoria) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoria no encontrada",
      });
    }

    const note = await prisma.nota.create({
      data: {
        titulo: parsed.data.titulo,
        contenido: parsed.data.contenido,
        categoriaId: parsed.data.categoriaId,
        usuarioId: req.user.id,
        fecha_creacion: new Date(parsed.data.fecha_creacion),
        fecha_ultima_modificacion: new Date(),
        tags: parsed.data.tags || null,
        pinned: parsed.data.pinned || false,
        favorite: parsed.data.favorite || false,
      },
    });
    await logAudit({
      action: "create",
      entity: "nota",
      entityId: note.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { titulo: note.titulo },
    });
    res.status(200).json({
      ok: true,
      mensaje: "Nota creada",
      note,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear nota",
      error,
    });
  }
});

router.get("/note/search", verifyToken, async (req, res) => {
  const { q } = req.query;
  try {
    const notes = await prisma.nota.findMany({
      where: {
        usuarioId: req.user.id,
        OR: [
          { titulo: { contains: q || "" } },
          { contenido: { contains: q || "" } },
          { tags: { contains: q || "" } },
        ],
      },
      include: {
        categoria: true,
      },
    });
    res.status(200).json({
      ok: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al buscar notas",
      error,
    });
  }
});

router.get("/note", verifyToken, async (req, res) => {
  try {
    const notes = await prisma.nota.findMany({
      where: { usuarioId: req.user.id },
      include: {
        categoria: true,
        usuario: true,
      },
    });
    res.status(200).json({
      ok: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener notas",
      error,
    });
  }
});

router.get("/note/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const note = await prisma.nota.findFirst({
      where: { id: Number(id), usuarioId: req.user.id },
      include: { categoria: true, usuario: true },
    });
    if (!note) {
      return res.status(404).json({
        ok: false,
        mensaje: "Nota no encontrada",
      });
    }
    res.status(200).json({ ok: true, note });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener nota",
      error,
    });
  }
});

router.patch("/note/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const canEdit = await userHasRole(req.user.id, "edit_own_notes");
  const isAdmin = await userHasRole(req.user.id, "admin");
  if (!canEdit && !isAdmin) {
    return res.status(403).json({
      ok: false,
      mensaje: "No autorizado para editar notas",
    });
  }
  const noteschema = z.object({
    titulo: z.string().min(2).max(100),
    contenido: z.string().min(2).max(2000),
    categoriaId: z.number(),
    fecha_creacion: z.string(),
    tags: z.string().max(500).optional(),
    pinned: z.boolean().optional(),
    favorite: z.boolean().optional(),
  });

  try {
    const parsed = noteschema.partial().safeParse({
      ...req.body,
      categoriaId:
        req.body.categoriaId !== undefined
          ? Number(req.body.categoriaId)
          : undefined,
    });
    if (parsed.error) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error en los datos",
        error: parsed.error.message,
      });
    }

    const noteExistente = await prisma.nota.findFirst({
      where: { id: Number(id), usuarioId: req.user.id },
    });
    if (!noteExistente) {
      return res.status(404).json({
        ok: false,
        mensaje: "Nota no encontrada",
      });
    }

    if (parsed.data.categoriaId !== undefined) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: parsed.data.categoriaId,
          usuarioId: req.user.id,
        },
      });
      if (!categoria) {
        return res.status(404).json({
          ok: false,
          mensaje: "Categoria no encontrada",
        });
      }
    }

    const note = await prisma.nota.update({
      where: { id: Number(id) },
      data: {
        ...parsed.data,
        fecha_ultima_modificacion: new Date(),
        fecha_creacion: parsed.data.fecha_creacion
          ? new Date(parsed.data.fecha_creacion)
          : undefined,
      },
    });
    await logAudit({
      action: "update",
      entity: "nota",
      entityId: note.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { titulo: note.titulo },
    });

    res.status(200).json({
      ok: true,
      mensaje: "Nota actualizada",
      note,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar nota",
      error,
    });
  }
});

router.delete("/note/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const canDelete = await userHasRole(req.user.id, "delete_own_notes");
    const isAdmin = await userHasRole(req.user.id, "admin");
    if (!canDelete && !isAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "No autorizado para eliminar notas",
      });
    }

    const noteExistente = await prisma.nota.findFirst({
      where: { id: Number(id), usuarioId: req.user.id },
    });
    if (!noteExistente) {
      return res.status(404).json({
        ok: false,
        mensaje: "Nota no encontrada",
      });
    }

    await prisma.nota.delete({
      where: { id: Number(id) },
    });
    await logAudit({
      action: "delete",
      entity: "nota",
      entityId: Number(id),
      actorUserId: req.user.id,
      actorRole: "user",
    });

    res.status(200).json({
      ok: true,
      mensaje: "Nota eliminada",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar nota",
      error,
    });
  }
});

module.exports = router;
