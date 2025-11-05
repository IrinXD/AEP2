// --- /backend/models/Tarefa.js ---
const mongoose = require('mongoose');

const TarefaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descricao: { type: String, default: '' },
    status: {
        type: String,
        required: true,
        enum: ['A Fazer', 'Fazendo', 'Feito'], // Só permite esses 3 valores
        default: 'A Fazer'
    },
    projeto: { // Link para o projeto ao qual a tarefa pertence
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projeto',
        required: true
    }
});

module.exports = mongoose.model('Tarefa', TarefaSchema);