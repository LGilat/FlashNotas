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

router.post("/categorias", verifyToken, async (req, res) => {
  const canCreate = await userHasRole(req.user.id, "create_categories");
  const isAdmin = await userHasRole(req.user.id, "admin");
  if (!canCreate && !isAdmin) {
    return res.status(403).json({
      ok: false,
      mensaje: "No autorizado para crear categorias",
    });
  }
  const { nombre, descripcion } = req.body;

  const catschema = z.object({
    nombre: z
      .string({
        required_error: "El nombre es requerido",
        invalid_type_error: "El nombre debe ser un string",
      })
      .min(3)
      .max(100),
    descripcion: z
      .string({
        required_error: "La descripcion es requerida",
        invalid_type_error: "La descripcion debe ser un string",
      })
      .min(3)
      .max(100),
  });

  try {
    const result = catschema.safeParse({ nombre, descripcion });
    if (result.error) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error en los datos",
        error: result.error.message,
      });
    }

    const categoria = await prisma.categoria.create({
      data: {
        ...result.data,
        usuarioId: req.user.id,
        fecha_creacion: new Date().toISOString(),
      },
    });
    await logAudit({
      action: "create",
      entity: "categoria",
      entityId: categoria.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { nombre: categoria.nombre },
    });
    res.status(200).json({
      ok: true,
      mensaje: "Categoria creada",
      categoria,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear categoria",
      error,
    });
  }
});

router.get("/categorias", verifyToken, async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: {
        usuarioId: req.user.id,
      },
    });
    res.status(200).json({
      ok: true,
      categorias,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener categorias",
      error,
    });
  }
});

router.get("/categorias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const categoria = await prisma.categoria.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!categoria || categoria.usuarioId !== req.user.id) {
      res.status(404).json({
        ok: false,
        mensaje: "Categoria no encontrada",
      });
    } else {
      res.status(200).json({
        ok: true,
        categoria,
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener categoria",
      error,
    });
  }
});

router.patch("/categorias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const canEdit = await userHasRole(req.user.id, "edit_own_categories");
  const isAdmin = await userHasRole(req.user.id, "admin");
  if (!canEdit && !isAdmin) {
    return res.status(403).json({
      ok: false,
      mensaje: "No autorizado para editar categorias",
    });
  }
  const catschema = z.object({
    nombre: z
      .string({
        required_error: "El nombre es requerido",
        invalid_type_error: "El nombre debe ser un string",
      })
      .min(3)
      .max(100),
    descripcion: z
      .string({
        required_error: "La descripcion es requerida",
        invalid_type_error: "La descripcion debe ser un string",
      })
      .min(3)
      .max(100),
  });

  try {
    const result = catschema.partial().safeParse(req.body);
    if (result.error) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error en los datos",
        error: result.error.message,
      });
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });
    if (!categoriaExistente || categoriaExistente.usuarioId !== req.user.id) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoria no encontrada",
      });
    }

    const categoria = await prisma.categoria.update({
      where: {
        id: Number(id),
      },
      data: {
        ...result.data,
      },
    });
    await logAudit({
      action: "update",
      entity: "categoria",
      entityId: categoria.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { nombre: categoria.nombre },
    });
    res.status(200).json({
      ok: true,
      mensaje: "Categoria actualizada",
      categoria,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar categoria",
      error,
    });
  }
});

router.delete("/categorias/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const canDelete = await userHasRole(req.user.id, "delete_own_categories");
    const isAdmin = await userHasRole(req.user.id, "admin");
    if (!canDelete && !isAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "No autorizado para eliminar categorias",
      });
    }
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });
    if (!categoria || categoria.usuarioId !== req.user.id) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoria no encontrada",
      });
    }

    await prisma.$transaction([
      prisma.nota.deleteMany({
        where: { categoriaId: Number(id), usuarioId: req.user.id },
      }),
      prisma.categoria.delete({
        where: { id: Number(id) },
      }),
    ]);
    await logAudit({
      action: "delete",
      entity: "categoria",
      entityId: Number(id),
      actorUserId: req.user.id,
      actorRole: "user",
    });

    res.status(200).json({
      ok: true,
      mensaje: "Categoria eliminada",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar categoria",
      error,
    });
  }
});

module.exports = router;
