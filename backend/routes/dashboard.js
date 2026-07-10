const express = require("express");
const prisma = require("../prismaClient");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalNotes, totalCategories, pinnedNotes, favoriteNotes] = await Promise.all([
      prisma.nota.count({ where: { usuarioId: userId } }),
      prisma.categoria.count({ where: { usuarioId: userId } }),
      prisma.nota.count({ where: { usuarioId: userId, pinned: true } }),
      prisma.nota.count({ where: { usuarioId: userId, favorite: true } }),
    ]);

    const latestNotes = await prisma.nota.findMany({
      where: { usuarioId: userId },
      orderBy: { fecha_ultima_modificacion: 'desc' },
      take: 5,
      include: { categoria: true }
    });

    const recentActivity = await prisma.auditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.status(200).json({
      ok: true,
      stats: {
        totalNotes,
        totalCategories,
        pinnedNotes,
        favoriteNotes
      },
      latestNotes,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener datos del dashboard",
      error: error.message
    });
  }
});

module.exports = router;
