const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const categoriasRoutes = require("./routes/categorias");
const notasRoutes = require("./routes/notas");
const adminRoutes = require("./routes/admin");
const adminManageRoutes = require("./routes/adminManage");
const roleRequestsRoutes = require("./routes/roleRequests");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Agregar esta línea
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  cors({
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    optionsSuccessStatus: 204
  }),
);

// Manejar preflight de forma explícita para todas las rutas
app.options("*", cors());

app.use(authRoutes);
app.use(categoriasRoutes);
app.use(notasRoutes);
app.use(adminRoutes);
app.use(adminManageRoutes);
app.use(roleRequestsRoutes);
app.use(dashboardRoutes);

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
