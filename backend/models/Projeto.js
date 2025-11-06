// --- /backend/models/Projeto.js (Atualizado) ---
const mongoose = require('mongoose');

const ProjetoSchema = new mongoose.Schema({
    nome: { type: String, required: true },

    dono: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Referencia o modelo 'Usuario'
        required: true
    }
});

module.exports = mongoose.model('Projeto', ProjetoSchema);