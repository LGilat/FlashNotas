const bcrypt = require("bcrypt");
const prisma = require("./backend/prismaClient");

const updateAdminPassword = async () => {
  const username = "admin";
  const newPassword = "Admin2026";
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.usuario.update({
      where: { nombre: username },
      data: { password: hashedPassword }
    });
    console.log(`Contraseña actualizada para el usuario: ${updated.nombre}`);
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
  } finally {
    await prisma.$disconnect();
  }
};

updateAdminPassword();
