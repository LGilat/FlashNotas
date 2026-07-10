const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const prisma = require("../prismaClient");
const verifyToken = require("../middleware/verifyToken");
const { logAudit } = require("../utils/audit");
const z = require("zod");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage });

const getUserRoles = async (userId) => {
  const roles = await prisma.rolUsuario.findMany({
    where: { usuarioId: userId },
    include: { rol: true },
  });
  return roles.map((r) => r.rol.rol);
};

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (nombre === "" || email === "" || password === "") {
    res.status(400).json({
      ok: false,
      mensaje: "Faltan campos por llenar",
    });
  } else {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const usuario = {
        nombre,
        email,
        password: hashedPassword,
        avatarUrl: null,
        tokenVersion: 0,
        fecha_registro: new Date().toISOString(),
      };
      const usuarioGuardado = await prisma.usuario.create({
        data: usuario,
      });

      // Crear categoría por defecto "General" para nuevos usuarios
      await prisma.categoria.create({
        data: {
          nombre: "General",
          descripcion: "Tu primera categoría para empezar a organizar",
          usuarioId: usuarioGuardado.id,
          fecha_creacion: new Date().toISOString(),
        },
      });

      const JWT_SECRET = process.env.JWT_SECRET_KEY;
      const tokenId = randomUUID();
      await prisma.session.create({
        data: {
          tokenId,
          usuarioId: usuarioGuardado.id,
        },
      });
      const token = jwt.sign(
        {
          user: {
            id: usuarioGuardado.id,
            nombre: usuarioGuardado.nombre,
            tokenVersion: usuarioGuardado.tokenVersion,
          },
          sid: tokenId,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
      );
      res.status(200).json({
        ok: true,
        mensaje: "Usuario creado",
        usuario: usuarioGuardado,
        token: token,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        mensaje: "Error al crear usuario",
        error,
      });
    }
  }
});

router.post("/login", async (req, res) => {
  const { nombre, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: {
        nombre,
      },
    });

    if (!usuario) {
      res.status(401).json({
        ok: false,
        mensaje: "Usuario o contraseña incorrectos",
      });
    } else {
      const passwordMatch = await bcrypt.compare(password, usuario.password);
      if (!passwordMatch) {
        res.status(401).json({
          ok: false,
          mensaje: "Usuario o contraseña incorrectos",
        });
      } else {
        const JWT_SECRET = process.env.JWT_SECRET_KEY;
        const tokenId = randomUUID();
        await prisma.session.create({
          data: {
            tokenId,
            usuarioId: usuario.id,
            userAgent: req.headers["user-agent"] || null,
            ip: req.ip || null,
          },
        });
        const token = jwt.sign(
          {
            user: {
              id: usuario.id,
              nombre: usuario.nombre,
              tokenVersion: usuario.tokenVersion,
            },
            sid: tokenId,
          },
          JWT_SECRET,
          {
            expiresIn: "1h",
          },
        );
        let roles = [];
        try {
          roles = await getUserRoles(usuario.id);
        } catch (error) {
          roles = [];
        }
        const isAdmin = roles.includes("admin");

        res.json({
          ok: true,
          mensaje: "Inicio de sesión exitoso",
          token: token,
          nombre: usuario.nombre,
          id: usuario.id,
          isAdmin,
          roles,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al iniciar sesión",
      error,
    });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
    });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    const roles = await getUserRoles(usuario.id);
    const recentNotes = await prisma.nota.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { fecha_ultima_modificacion: "desc" },
      take: 5,
    });
    const sessions = await prisma.session.findMany({
      where: { usuarioId: usuario.id, revokedAt: null },
      orderBy: { lastSeen: "desc" },
      take: 10,
    });

    const totalNotes = await prisma.nota.count({ where: { usuarioId: usuario.id } });
    const totalCategories = await prisma.categoria.count({ where: { usuarioId: usuario.id } });
    const favoriteNotes = await prisma.nota.count({ where: { usuarioId: usuario.id, favorite: true } });
    const pinnedNotes = await prisma.nota.count({ where: { usuarioId: usuario.id, pinned: true } });

    res.json({
      ok: true,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        avatarUrl: usuario.avatarUrl,
        fecha_registro: usuario.fecha_registro,
      },
      roles,
      isAdmin: roles.includes("admin"),
      recentNotes,
      sessions,
      stats: {
        totalNotes,
        totalCategories,
        favoriteNotes,
        pinnedNotes
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al obtener perfil", error });
  }
});

router.patch("/me", verifyToken, async (req, res) => {
  const schema = z.object({
    nombre: z.string().min(3).max(100),
    email: z.string().email(),
    avatarUrl: z.string().nullable().optional(),
  });
  try {
    const parsed = schema.partial().safeParse(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", error: parsed.error.message });
    }
    const updated = await prisma.usuario.update({
      where: { id: req.user.id },
      data: parsed.data,
    });
    await logAudit({
      action: "update_profile",
      entity: "usuario",
      entityId: updated.id,
      actorUserId: updated.id,
      actorRole: "user",
      details: { nombre: updated.nombre, email: updated.email, avatarUrl: updated.avatarUrl },
    });
    res.json({
      ok: true,
      user: {
        id: updated.id,
        nombre: updated.nombre,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        fecha_registro: updated.fecha_registro,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al actualizar perfil", error });
  }
});

router.post("/me/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const updated = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });
    await logAudit({
      action: "update_avatar",
      entity: "usuario",
      entityId: updated.id,
      actorUserId: updated.id,
      actorRole: "user",
      details: { avatarUrl },
    });
    res.json({ ok: true, avatarUrl });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al subir avatar", error });
  }
});

router.post("/me/password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, mensaje: "Faltan campos" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ ok: false, mensaje: "La nueva contraseña es muy corta" });
  }
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
    });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    const match = await bcrypt.compare(currentPassword, usuario.password);
    if (!match) {
      return res.status(401).json({ ok: false, mensaje: "Contraseña actual incorrecta" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    });
    await logAudit({
      action: "change_password",
      entity: "usuario",
      entityId: usuario.id,
      actorUserId: usuario.id,
      actorRole: "user",
    });
    res.json({ ok: true, mensaje: "Contraseña actualizada" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al cambiar contraseña", error });
  }
});

router.post("/me/logout-others", verifyToken, async (req, res) => {
  try {
    await prisma.session.updateMany({
      where: {
        usuarioId: req.user.id,
        tokenId: { not: req.sessionId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    const updated = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });
    const tokenId = req.sessionId || randomUUID();
    const token = jwt.sign(
      {
        user: {
          id: updated.id,
          nombre: updated.nombre,
          tokenVersion: updated.tokenVersion,
        },
        sid: tokenId,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );
    await logAudit({
      action: "logout_others",
      entity: "usuario",
      entityId: updated.id,
      actorUserId: updated.id,
      actorRole: "user",
    });
    res.json({ ok: true, token });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al cerrar otras sesiones", error });
  }
});

router.post("/me/email-change", verifyToken, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) {
    return res.status(400).json({ ok: false, mensaje: "Email requerido" });
  }
  try {
    const exists = await prisma.usuario.findUnique({ where: { email: newEmail } });
    if (exists) {
      return res.status(400).json({ ok: false, mensaje: "Email ya en uso" });
    }
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.emailChangeRequest.create({
      data: {
        usuarioId: req.user.id,
        newEmail,
        token,
        expiresAt,
      },
    });
    // En producción, enviar por email. Aquí devolvemos el token.
    res.json({ ok: true, token });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al solicitar cambio de email", error });
  }
});

router.post("/me/email-change/confirm", verifyToken, async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ ok: false, mensaje: "Token requerido" });
  }
  try {
    const request = await prisma.emailChangeRequest.findUnique({ where: { token } });
    if (!request || request.usedAt || request.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, mensaje: "Token inválido o expirado" });
    }
    if (request.usuarioId !== req.user.id) {
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { email: request.newEmail },
    });
    await prisma.emailChangeRequest.update({
      where: { id: request.id },
      data: { usedAt: new Date() },
    });
    await logAudit({
      action: "change_email",
      entity: "usuario",
      entityId: req.user.id,
      actorUserId: req.user.id,
      actorRole: "user",
      details: { newEmail: request.newEmail },
    });
    res.json({ ok: true, mensaje: "Email actualizado" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al confirmar email", error });
  }
});

module.exports = router;
