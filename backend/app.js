const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const qs = require('qs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Agregar esta línea
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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


const port = 3000;
const server=app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

