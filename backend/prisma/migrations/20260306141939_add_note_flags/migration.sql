-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Nota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tags" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha_creacion" DATETIME NOT NULL,
    "fecha_ultima_modificacion" DATETIME NOT NULL,
    CONSTRAINT "Nota_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Nota" ("categoriaId", "contenido", "fecha_creacion", "fecha_ultima_modificacion", "id", "titulo", "usuarioId") SELECT "categoriaId", "contenido", "fecha_creacion", "fecha_ultima_modificacion", "id", "titulo", "usuarioId" FROM "Nota";
DROP TABLE "Nota";
ALTER TABLE "new_Nota" RENAME TO "Nota";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
