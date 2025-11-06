// --- /backend/server.js  ---

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar nossos modelos
const Projeto = require('./models/Projeto');
const Tarefa = require('./models/Tarefa');

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


// --- ROTAS DA API ---

// Rota 1: Criar uma nova tarefa 
app.post('/tarefas', async (req, res) => {
    try {
        const novaTarefa = new Tarefa(req.body);
        await novaTarefa.save();
        res.status(201).json(novaTarefa);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota 2: Buscar TODAS as tarefas de um projeto (ESTAVA FALTANDO - O ERRO 404!)
app.get('/projetos/:projetoId/tarefas', async (req, res) => {
    try {
        const tarefas = await Tarefa.find({ projeto: req.params.projetoId });
        res.json(tarefas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 3: Buscar UMA tarefa específica por ID (Para o Modal de Edição)
app.get('/tarefas/:id', async (req, res) => {
    try {
        const tarefa = await Tarefa.findById(req.params.id);
        if (!tarefa) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        res.json(tarefa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 4: ATUALIZAR uma tarefa (Mover OU Editar)
app.put('/tarefas/:id', async (req, res) => {
    try {
        const { status, titulo, descricao } = req.body;

        const camposParaAtualizar = {};
        if (status) {
            camposParaAtualizar.status = status;
        }
        if (titulo) {
            camposParaAtualizar.titulo = titulo;
        }
        if (descricao !== undefined) {
            camposParaAtualizar.descricao = descricao;
        }

        const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
            req.params.id,
            { $set: camposParaAtualizar },
            { new: true }
        );

        if (!tarefaAtualizada) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        res.json(tarefaAtualizada);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/tarefas/:id', async (req, res) => {
    try {
        const tarefaExcluida = await Tarefa.findByIdAndDelete(req.params.id);

        if (!tarefaExcluida) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }

        // Responde com sucesso, mas sem conteúdo (padrão 204)
        res.status(204).send();

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});