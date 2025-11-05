// --- /backend/models/Projeto.js ---
const mongoose = require('mongoose');

const ProjetoSchema = new mongoose.Schema({
    nome: { type: String, required: true }
});

module.exports = mongoose.model('Projeto', ProjetoSchema);