const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");

const CREDENTIALS_PATH = path.join(__dirname, "..", "admin.credentials.txt");

const parseCredentials = (raw) => {
  const lines = raw.split("\n");
  const creds = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    creds[key.trim()] = rest.join(":").trim();
  }
  return creds;
};

const main = async () => {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("No se encontró admin.credentials.txt");
  }

  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const creds = parseCredentials(raw);
  const username = creds.username;
  const password = creds.password;

  if (!username || !password) {
    throw new Error("Credenciales inválidas en admin.credentials.txt");
  }

  let adminRole = await prisma.rol.findFirst({ where: { rol: "admin" } });
  if (!adminRole) {
    adminRole = await prisma.rol.create({
      data: { rol: "admin", descripcion: "Administrador del sistema" },
    });
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { nombre: username },
  });

  let user;
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.usuario.create({
      data: {
        nombre: username,
        email: `${username}@flashnotes.local`,
        password: hashedPassword,
        fecha_registro: new Date().toISOString(),
      },
    });
  } else {
    user = existingUser;
  }

  const existingRole = await prisma.rolUsuario.findUnique({
    where: {
      usuarioId_rolId: {
        usuarioId: user.id,
        rolId: adminRole.id,
      },
    },
  });

  if (!existingRole) {
    await prisma.rolUsuario.create({
      data: {
        usuarioId: user.id,
        rolId: adminRole.id,
      },
    });
  }

  // Crear categoría por defecto para que pueda empezar a trabajar
  const existingCategory = await prisma.categoria.findFirst({
    where: { usuarioId: user.id }
  });

  if (!existingCategory) {
    await prisma.categoria.create({
      data: {
        nombre: 'General',
        descripcion: 'Categoría por defecto para administración',
        usuarioId: user.id,
        fecha_creacion: new Date().toISOString()
      }
    });
    console.log(`Categoría "General" creada para el admin.`);
  }

  console.log(`Admin listo: ${username}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
