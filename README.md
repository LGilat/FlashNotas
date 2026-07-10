# FlashNotas 📝

FlashNotas es una aplicación moderna y ligera de gestión de notas diseñada para la productividad personal. Con una interfaz inspirada en Notion y Google Keep, permite organizar tus ideas de forma rápida, visual y profesional.

## ✨ Características Principales

*   **Dashboard Inteligente:** Resumen visual de tu actividad reciente, estadísticas de notas y accesos rápidos a lo más importante.
*   **Gestión Pro de Notas:**
    *   Vistas intercambiables: **Cuadrícula (Grid)** para una vista visual o **Lista** para una gestión compacta.
    *   Organización por **Categorías con colores** dinámicos.
    *   Sistema de **Etiquetas (#tags)** interactivas para navegación rápida.
    *   Notas **Fijadas** y **Favoritas** para acceso prioritario.
*   **Herramientas de Productividad:**
    *   **Nota Rápida:** Crea pensamientos al vuelo desde cualquier pantalla.
    *   **Buscador en Tiempo Real:** Localiza palabras clave resaltadas visualmente.
    *   **Copiado Rápido:** Copia el contenido de tus notas al portapapeles con un solo clic.
    *   **Exportación:** Descarga tus notas en formatos **Markdown** o **Texto Plano**.
*   **Seguridad y Control:**
    *   Sistema de autenticación y perfiles de usuario.
    *   Historial de actividad (Audit Log) para rastrear cambios.
    *   Protección contra pérdida de datos en formularios.

## 🚀 Tecnologías

*   **Frontend:** React, Vite, Context API, Formik + Yup.
*   **Backend:** NodeJS, Express, Prisma ORM.
*   **Base de Datos:** SQLite (ligera y portable).

## 🛠️ Instalación y Configuración

1.  **Backend:**
    *   Navega a la carpeta `backend`.
    *   Ejecuta `npm install`.
    *   Configura tu archivo `.env` (DATABASE_URL y JWT_SECRET_KEY).
    *   Ejecuta `npx prisma migrate dev` para preparar la base de datos.
    *   Inicia con `npm start`.

2.  **Frontend:**
    *   Navega a la carpeta `flashnotes/flashnotes`.
    *   Ejecuta `npm install`.
    *   Inicia con `npm run dev`.

## 👩‍💻 Usuario de Prueba (Admin)

*   **Usuario:** `admin`
*   **Contraseña:** `Admin2026`

---
Desarrollado con ❤️ para maximizar tu productividad.
