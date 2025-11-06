// --- /frontend/auth.js ---

const API_URL = 'http://localhost:3000';

const naPaginaDeLogin = window.location.pathname.includes('login.html');
const naPaginaDeRegister = window.location.pathname.includes('register.html');

// --- LÓGICA DE LOGIN ---
if (naPaginaDeLogin) {
    const loginForm = document.getElementById('login-form');
    const msgErro = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgErro.textContent = '';

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login.');
            }


            localStorage.setItem('devplanner_token', data.token);

            window.location.href = 'index.html';
        } catch (err) {
            msgErro.textContent = err.message;
        }
    });
}

// --- LÓGICA DE REGISTRO ---
if (naPaginaDeRegister) {
    const registerForm = document.getElementById('register-form');
    const msgErro = document.getElementById('error-message');
    const msgSucesso = document.getElementById('success-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgErro.textContent = '';
        msgSucesso.textContent = '';

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao registrar.');
            }


            msgSucesso.textContent = 'Usuário criado! Redirecionando para o login...';


            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (err) {
            msgErro.textContent = err.message;
        }
    });
}