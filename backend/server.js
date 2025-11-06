// --- /backend/server.js  ---

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importar nossos modelos
const Projeto = require('./models/Projeto');
const Tarefa = require('./models/Tarefa');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permite comunicação entre frontend e backend
app.use(express.json()); // Permite ao servidor entender JSON

// --- Conexão com o MongoDB Atlas ---
const MONGO_URI = "mongodb+srv://gagarcia1000:ParaTeste123@cluster0.t8x1tuy.mongodb.net/dev-planner?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));



const JWT_SECRET = "meu-segredo-super-secreto-123";

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const middlewareDeAuth = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];


    if (!token) {

        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        req.usuario = payload;


        next();

    } catch (err) {

        res.status(403).json({ message: 'Token inválido.' });
    }
};


// --- ROTAS DE AUTENTICAÇÃO ---


app.post('/projetos', middlewareDeAuth, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ message: 'O nome do projeto é obrigatório.' });
        }

        const novoProjeto = new Projeto({
            nome: nome,
            dono: req.usuario.id
        });

        await novoProjeto.save();
        res.status(201).json(novoProjeto);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar projeto.', error: err.message });
    }
});


app.get('/projetos', middlewareDeAuth, async (req, res) => {
    try {
        const projetos = await Projeto.find({ dono: req.usuario.id });
        res.json(projetos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar projetos.', error: err.message });
    }
});


// Rota 1: Registro (POST /auth/register)
app.post('/auth/register', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const usuarioExistente = await Usuario.findOne({ email: email });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const novoUsuario = new Usuario({
            email: email,
            senha: senhaHash
        });
        await novoUsuario.save();

        res.status(201).json({ message: 'Usuário criado com sucesso!' });

    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.', error: err.message });
    }
});

// Rota 2: Login (POST /auth/login)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // 1. Verificar se o usuário existe
        const usuario = await Usuario.findOne({ email: email });
        if (!usuario) {
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        // 2. Comparar a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: usuario._id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 4. Enviar o token de volta para o frontend
        res.json({ message: 'Login bem-sucedido!', token: token });

    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor ao tentar logar.', error: err.message });
    }
});



// Rota 1: Criar uma nova tarefa 
app.post('/tarefas', middlewareDeAuth, async (req, res) => {
    try {
        const projeto = await Projeto.findById(req.body.projeto);
        if (!projeto) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }
        if (projeto.dono.toString() !== req.usuario.id) {
            return res.status(403).json({ message: 'Acesso negado a este projeto.' });
        }

        const novaTarefa = new Tarefa(req.body);
        await novaTarefa.save();
        res.status(201).json(novaTarefa);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota 2: Buscar TODAS as tarefas de um projeto
app.get('/projetos/:projetoId/tarefas', middlewareDeAuth, async (req, res) => {
    try {

        const projeto = await Projeto.findById(req.params.projetoId);
        if (!projeto) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }
        if (projeto.dono.toString() !== req.usuario.id) {
            return res.status(403).json({ message: 'Acesso negado a este projeto.' });
        }

        const tarefas = await Tarefa.find({ projeto: req.params.projetoId });
        res.json(tarefas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function checarPosseTarefa(tarefaId, usuarioId) {
    const tarefa = await Tarefa.findById(tarefaId).populate('projeto');
    if (!tarefa) return null;
    if (tarefa.projeto.dono.toString() !== usuarioId) return false;
    return tarefa;
}

// Rota 3: Buscar UMA tarefa específica por ID (Para o Modal de Edição)
app.get('/tarefas/:id', middlewareDeAuth, async (req, res) => {
    try {
        const tarefa = await checarPosseTarefa(req.params.id, req.usuario.id);
        if (tarefa === null) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        if (tarefa === false) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        res.json(tarefa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 4: ATUALIZAR uma tarefa (Mover OU Editar)
app.put('/tarefas/:id', middlewareDeAuth, async (req, res) => {
    try {
        const tarefa = await checarPosseTarefa(req.params.id, req.usuario.id);
        if (tarefa === null) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        if (tarefa === false) return res.status(403).json({ message: 'Acesso negado.' });

        const { status, titulo, descricao } = req.body;
        const camposParaAtualizar = {};
        if (status) camposParaAtualizar.status = status;
        if (titulo) camposParaAtualizar.titulo = titulo;
        if (descricao !== undefined) camposParaAtualizar.descricao = descricao;

        const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
            req.params.id,
            { $set: camposParaAtualizar },
            { new: true }
        );
        res.json(tarefaAtualizada);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/tarefas/:id', middlewareDeAuth, async (req, res) => {
    try {
        const tarefa = await checarPosseTarefa(req.params.id, req.usuario.id);
        if (tarefa === null) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        if (tarefa === false) return res.status(403).json({ message: 'Acesso negado.' });

        await Tarefa.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});