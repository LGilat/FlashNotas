const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const verifyToken = async (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    return res.status(401).json({
      ok: false,
      mensaje: "No autorizado",
    });
  }
  try {
    const token = bearer.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded.user;
    req.sessionId = decoded.sid;
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { tokenVersion: true },
    });
    if (!user || user.tokenVersion !== req.user.tokenVersion) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token inválido",
      });
    }
    const session = await prisma.session.findFirst({
      where: { tokenId: req.sessionId, usuarioId: req.user.id, revokedAt: null },
    });
    if (!session) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token inválido",
      });
    }
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeen: new Date() },
    });
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      mensaje: "Token inválido",
    });
  }
};

module.exports = verifyToken;
