// --- /backend/models/Usuario.js ---

const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    senha: {
        type: String,
        required: true
        // salvaremos o "hash" (criptografado)
    }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);