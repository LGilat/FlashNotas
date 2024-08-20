const express = require('express');
const { randomUUID } = require('node:crypto');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const qs = require('qs');
const jwt = require('jsonwebtoken');
const z = require('zod');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Agregar esta línea
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    headers: ['Content-Type', 'Authorization']
}));    


app.post('/signup', async (req, res) => {
   
    const { nombre, email, password } = req.body;
    
    if (nombre === '' || email === '' || password === '') {
        res.status(400).json({
            ok: false,
            mensaje: 'Faltan campos por llenar'
        });
    } 
    else {
        try{
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const JWT_SECRET = process.env.JWT_SECRET_KEY;
            const token = jwt.sign({user: nombre}, JWT_SECRET, { expiresIn: '1h' });
            const usuario = {
                nombre,
                email,
                password: hashedPassword,
                fecha_registro: new Date().toISOString(),
            };
            const usuarioGuardado = await prisma.usuario.create({
                data: usuario
            });
            res.status(200).json({
                ok: true,
                mensaje: 'Usuario creado',
                usuario: usuarioGuardado,
                token: token,
            });
        } catch (error) {
            res.status(500).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                error
            });
        }
    }
});

app.post('/login', async (req, res) => {
    const { nombre, password } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: {
                nombre
            }
        });
        if (!usuario) {
            res.status(401).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        } else {
            const passwordMatch = await bcrypt.compare(password, usuario.password);
            if (!passwordMatch) {
                res.status(401).json({
                    ok: false,
                    mensaje: 'Usuario o contraseña incorrectos'
                });
            } else {
                const JWT_SECRET = process.env.JWT_SECRET_KEY;
                const token = jwt.sign({user: usuario.nombre}, JWT_SECRET, { expiresIn: '1h' });
                res.json({
                    ok: true,
                    mensaje: 'Inicio de sesión exitoso',
                    token: token,
                    nombre: usuario.nombre,
                    id: usuario.id
                });
            }
        }
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al iniciar sesión',
            error
        });
    }

});

app.post('/categorias', async (req, res) => {
    const { nombre, descripcion, username } = req.body;
  
    const catschema = z.object({
        nombre: z.string({
            required_error: 'El nombre es requerido',
            invalid_type_error: 'El nombre debe ser un string'
        }).min(3).max(100),
        descripcion: z.string({
            required_error: 'La descripcion es requerida',
            invalid_type_error: 'La descripcion debe ser un string'
        }).min(3).max(100),
        
        
    });

    try{
        const token =  req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY); // Ajusta el secreto JWT

        if (decoded.rol !== 'admin') {
            return res.status(403).json({
                ok: false,
                mensaje: 'No tienes permisos para realizar esta acción'
            });
        }
    }

    catch (error) {
         // Manejo de errores, incluyendo errores de JWT
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token expirado'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token inválido'
            });
        } else {
            // Otros errores
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al crear categoría',
                error
            });
        }
    }

    try {

        const result = catschema.safeParse(req.body);
        if (result.error ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Error en los datos',
                error: result.error.message
            });
        }

        const user = await prisma.usuario.findUnique({
            where: {
                nombre: username
            }
        });


        const categoria = await prisma.categoria.create({
            data: {
                ...result.data,
                usuarioId: user.id,
                fecha_creacion: new Date().toISOString(),
            }
        });
        res.status(200).json({
            ok: true,
            mensaje: 'Categoria creada',
            categoria
        });
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear categoria',
            error
        });
    }
});

app.get('/categorias', async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany();
        res.status(200).json({
            ok: true,
            categorias
        });
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener categorias',
            error
        });
    }
});

app.get('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const categoria = await prisma.categoria.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!categoria) {
            res.status(404).json({
                ok: false,
                mensaje: 'Categoria no encontrada'
            });
        } else {
            res.status(200).json({
                ok: true,
                categoria
            });
        }
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener categoria',
            error
        });
    }
});

app.patch('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    const catschema = z.object({
        nombre: z.string({
            required_error: 'El nombre es requerido',
            invalid_type_error: 'El nombre debe ser un string'
        }).min(3).max(100),
        descripcion: z.string({
            required_error: 'La descripcion es requerida',
            invalid_type_error: 'La descripcion debe ser un string'
        }).min(3).max(100),
        usuarioId: z.number({
            required_error: 'El usuarioId es requerido',
            invalid_type_error: 'El usuarioId debe ser un numero'
        })
    });

    try {
        const result = catschema.partial().safeParse(req.body);
        if (result.error ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Error en los datos',
                error: result.error.message
            });
        }
        const categoria = await prisma.categoria.update({
            where: {
                id: Number(id)
            },
            data: {
               ...result.data,
               fecha_creacion: new Date().toISOString(),
            }
        });
        res.status(200).json({
            ok: true,
            mensaje: 'Categoria actualizada',
            categoria
        });
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener categoria',
            error
        });
    }
});


app.post('/administradores', async (req, res) => {
    const adminschema = z.object({
        nombre: z.string({
            required_error: 'El nombre es requerido',
            invalid_type_error: 'El nombre debe ser un string'
        }).min(3).max(100),
        password: z.string({
            required_error: 'La contraseña es requerida',
            invalid_type_error: 'La contraseña debe ser un string'
        }).min(3).max(100)
    
    });

    try{
        const result = adminschema.safeParse(req.body);
        if (result.error ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Error en los datos',
                error: result.error.message
            });
        }

        const secretKey = result.data.password;

        if ( secretKey !== process.env.ADMIN_SECRET_KEY ) {
            return res.status(401).json({
                ok: false,
                mensaje: 'No autorizado'
            });
        }
    }
    catch (error){
        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear administrador',
            error
        });
    }

});

app.post('/asignar-rol', async (req, res) => {
    let adminRol=null;
    const { nombre, password, secretKey } = req.body;

    const adminschema = z.object({
        nombre: z.string().min(3).max(100),
        password: z.string().min(3).max(100),
        secretKey: z.string().min(3).max(100)
    });

    const result = adminschema.safeParse(req.body);
    if (result.error ){
        return res.status(400).json({
            ok: false,
            mensaje: 'Error en los datos',
            error: result.error.message
        });
    }

    if ( secretKey !== process.env.ADMIN_SECRET_KEY ) {
        return res.status(401).json({
            ok: false,
            mensaje: 'No autorizado'
        });
    }

    try{

        const user = await prisma.usuario.findUnique({
            where: {
                nombre: nombre
            }
        });

        if (!user) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Contraseña incorrecta'
            });
        }

        try{
             adminRol = await prisma.rol.findFirst({
                where: {
                    rol: 'admin'
                }
            });
          
        }
        catch (error){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al obtener rol de admin',
                error
            });
        }


        if (!adminRol) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Rol de admin no encontrado'
            });
        }

       try{

            const existeRolusuario=await prisma.rolUsuario.findUnique({
                where: {
                    usuarioId_rolId: {
                        usuarioId: user.id,
                        rolId: adminRol.id
                      }
                }
            });

            
            if ( existeRolusuario){
                console.log(existeRolusuario);
                const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
                const token = jwt.sign({ user: user.nombre, rol: adminRol.rol }, ADMIN_SECRET_KEY, { expiresIn: '1h' });
                return res.status(200).json({
                    ok: true,
                    mensaje: 'El usuario ya tiene un rol asignado',
                    token: token,
                    nombre: user.nombre,
                    rol: adminRol.rol
                });
            }
       }
       catch (error){
        console.error('Detailed error:', error);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al verificar rol de admin (posible mala configuración de la consulta)',
                error
            });
       }

       

        await prisma.rolUsuario.create({
            data: {
                usuarioId: user.id,
                rolId: adminRol.id
            }
        });
        const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
        const token = jwt.sign({ user: user.nombre, rol: adminRol.rol }, ADMIN_SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({
            ok: true,
            mensaje: 'Rol asignado correectamente',
            token: token,
            nombre: user.nombre,
            rol: adminRol.rol
        });
    }
    catch (error){
        res.status(500).json({
            ok: false,
            mensaje: 'Error al asignar rol',
            error: error.message
        });
    }
})


const port = 3000;
const server=app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

