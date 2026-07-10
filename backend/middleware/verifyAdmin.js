const prisma = require("../prismaClient");
const verifyToken = require("./verifyToken");

const verifyAdmin = async (req, res, next) => {
  verifyToken(req, res, async () => {
    try {
      const adminRole = await prisma.rol.findFirst({
        where: { rol: "admin" },
      });
      if (!adminRole) {
        return res.status(403).json({
          ok: false,
          mensaje: "Rol admin no configurado",
        });
      }

      const hasRole = await prisma.rolUsuario.findUnique({
        where: {
          usuarioId_rolId: {
            usuarioId: req.user.id,
            rolId: adminRole.id,
          },
        },
      });

      if (!hasRole) {
        return res.status(403).json({
          ok: false,
          mensaje: "No autorizado (admin)",
        });
      }

      req.adminRole = adminRole;
      req.user.isAdmin = true;
      next();
    } catch (error) {
      res.status(500).json({
        ok: false,
        mensaje: "Error al verificar admin",
        error,
      });
    }
  });
};

module.exports = verifyAdmin;
