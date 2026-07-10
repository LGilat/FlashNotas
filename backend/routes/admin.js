const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const z = require("zod");
const prisma = require("../prismaClient");
const { logAudit } = require("../utils/audit");

const router = express.Router();

router.post("/administradores", async (req, res) => {
  const adminschema = z.object({
    nombre: z
      .string({
        required_error: "El nombre es requerido",
        invalid_type_error: "El nombre debe ser un string",
      })
      .min(3)
      .max(100),
    password: z
      .string({
        required_error: "La contraseña es requerida",
        invalid_type_error: "La contraseña debe ser un string",
      })
      .min(3)
      .max(100),
  });

  try {
    const result = adminschema.safeParse(req.body);
    if (result.error) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error en los datos",
        error: result.error.message,
      });
    }

    const secretKey = result.data.password;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado",
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear administrador",
      error,
    });
  }
});

router.post("/asignar-rol", async (req, res) => {
  let adminRol = null;
  const { nombre, password, secretKey } = req.body;

  const adminschema = z.object({
    nombre: z.string().min(3).max(100),
    password: z.string().min(3).max(100),
    secretKey: z.string().min(3).max(100),
  });

  const result = adminschema.safeParse(req.body);
  if (result.error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Error en los datos",
      error: result.error.message,
    });
  }

  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({
      ok: false,
      mensaje: "No autorizado",
    });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: {
        nombre: nombre,
      },
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        mensaje: "Contraseña incorrecta",
      });
    }

    try {
      adminRol = await prisma.rol.findFirst({
        where: {
          rol: "admin",
        },
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener rol de admin",
        error,
      });
    }

    if (!adminRol) {
      return res.status(404).json({
        ok: false,
        mensaje: "Rol de admin no encontrado",
      });
    }

    try {
      const existeRolusuario = await prisma.rolUsuario.findUnique({
        where: {
          usuarioId_rolId: {
            usuarioId: user.id,
            rolId: adminRol.id,
          },
        },
      });

      if (existeRolusuario) {
        console.log(existeRolusuario);
        const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
        const token = jwt.sign(
          { user: user.nombre, rol: adminRol.rol },
          ADMIN_SECRET_KEY,
          { expiresIn: "1h" },
        );
        return res.status(200).json({
          ok: true,
          mensaje: "El usuario ya tiene un rol asignado",
          token: token,
          nombre: user.nombre,
          rol: adminRol.rol,
        });
      }
    } catch (error) {
      console.error("Detailed error:", error);
      return res.status(500).json({
        ok: false,
        mensaje:
          "Error al verificar rol de admin (posible mala configuración de la consulta)",
        error,
      });
    }

    await prisma.rolUsuario.create({
      data: {
        usuarioId: user.id,
        rolId: adminRol.id,
      },
    });
    await logAudit({
      action: "assign_role",
      entity: "usuario",
      entityId: user.id,
      actorUserId: user.id,
      actorRole: adminRol.rol,
      details: { rol: adminRol.rol },
    });
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
    const token = jwt.sign(
      { user: user.nombre, rol: adminRol.rol },
      ADMIN_SECRET_KEY,
      { expiresIn: "1h" },
    );
    res.status(200).json({
      ok: true,
      mensaje: "Rol asignado correectamente",
      token: token,
      nombre: user.nombre,
      rol: adminRol.rol,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al asignar rol",
      error: error.message,
    });
  }
});

module.exports = router;
