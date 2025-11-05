// --- /backend/server.js ---

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar nossos futuros modelos (passo 2)
const Projeto = require('./models/Projeto');
const Tarefa = require('./models/Tarefa');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permite comunicação entre frontend e backend
app.use(express.json()); // Permite ao servidor entender JSON

// --- Conexão com o MongoDB Atlas ---
// AQUI ESTÁ A STRING QUE VOCÊ PEGOU DO ANEXO (imagem)!
// Eu apenas adicionei /dev-planner no final para organizar o banco.
const MONGO_URI = "mongodb+srv://gagarcia1000:ParaTeste123@cluster0.t8x1tuy.mongodb.net/dev-planner?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));


// --- ROTAS DA API (Nosso MVP) ---

// Rota para criar uma nova tarefa
// (Por enquanto, vamos simular que o ID do projeto é fixo)
app.post('/tarefas', async (req, res) => {
    try {
        // req.body contém os dados enviados pelo frontend (ex: titulo, descricao, projetoId)
        const novaTarefa = new Tarefa(req.body);
        await novaTarefa.save();
        res.status(201).json(novaTarefa);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota para buscar todas as tarefas de um projeto
app.get('/projetos/:projetoId/tarefas', async (req, res) => {
    try {
        const tarefas = await Tarefa.find({ projeto: req.params.projetoId });
        res.json(tarefas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota para mover uma tarefa (O ALGORITMO)
app.put('/tarefas/:id', async (req, res) => {
    try {
        const { status } = req.body;

        // Encontra a tarefa pelo ID e atualiza seu campo 'status'
        const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true } // Retorna o documento atualizado
        );

        if (!tarefaAtualizada) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        res.json(tarefaAtualizada); // Envia a tarefa atualizada de volta
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});