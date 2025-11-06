// --- /frontend/script.js (NOVO COMEÇO) ---

const token = localStorage.getItem('devplanner_token');

if (!token) {
    window.location.href = 'login.html';
}

const API_URL = 'http://localhost:3000';


/**
 * =================================================================
 * CLASSE 1: KanbanAPI (Versão Autenticação)
 * =================================================================
 */
class KanbanAPI {

    // Método "privado" para criar os cabeçalhos de autenticação
    static #getAuthHeaders() {
        const token = localStorage.getItem('devplanner_token');
        if (!token) {
            window.location.href = 'login.html';
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Método para buscar todas as tarefas de um projeto
    static async getTasks(projetoId) {
        try {
            const response = await fetch(`${API_URL}/projetos/${projetoId}/tarefas`, {
                method: 'GET',
                headers: this.#getAuthHeaders()
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao buscar tarefas da API.');
            return await response.json();
        } catch (error) {
            console.error('Erro em getTasks:', error);
            return [];
        }
    }

    // Método para criar uma nova tarefa
    static async createTask(projetoId, titulo) {
        const novaTarefa = { titulo: titulo, projeto: projetoId, status: "A Fazer" };
        try {
            const response = await fetch(`${API_URL}/tarefas`, {
                method: 'POST',
                headers: this.#getAuthHeaders(),
                body: JSON.stringify(novaTarefa)
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao criar tarefa na API.');
            return await response.json();
        } catch (error) {
            console.error('Erro em createTask:', error);
        }
    }

    static async updateTaskStatus(taskId, novoStatus) {
    }

    // Método para buscar detalhes de UMA tarefa
    static async getTaskDetails(taskId) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'GET',
                headers: this.#getAuthHeaders()
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao buscar detalhes da tarefa.');
            return await response.json();
        } catch (error) {
            console.error('Erro em getTaskDetails:', error);
        }
    }

    // Método para atualizar detalhes 
    static async updateTaskDetails(taskId, campos) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'PUT',
                headers: this.#getAuthHeaders(),
                body: JSON.stringify(campos)
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao atualizar detalhes da tarefa.');
            return await response.json();
        } catch (error) {
            console.error('Erro em updateTaskDetails:', error);
        }
    }

    // Método para excluir uma tarefa
    static async deleteTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'DELETE',
                headers: this.#getAuthHeaders() // <-- MUDANÇA!
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok && response.status !== 204) {
                throw new Error('Erro ao excluir tarefa na API.');
            }
            return true;
        } catch (error) {
            console.error('Erro em deleteTask:', error);
            return false;
        }
    }

    static async getProjects() {
        try {
            const response = await fetch(`${API_URL}/projetos`, {
                method: 'GET',
                headers: this.#getAuthHeaders()
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao buscar projetos.');
            return await response.json();
        } catch (error) {
            console.error('Erro em getProjects:', error);
            return [];
        }
    }

    static async createProject(nome) {
        try {
            const response = await fetch(`${API_URL}/projetos`, {
                method: 'POST',
                headers: this.#getAuthHeaders(),
                body: JSON.stringify({ nome: nome })
            });
            if (response.status === 401) window.location.href = 'login.html';
            if (!response.ok) throw new Error('Erro ao criar projeto.');
            return await response.json();
        } catch (error) {
            console.error('Erro em createProject:', error);
        }
    }
}


/**
 * =================================================================
 * CLASSE 2: Card
 * Representa um único cartão (tarefa) no Kanban.
 * =================================================================
 */
class Card {
    constructor(id, titulo, descricao) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao || '';

        this.element = this.createElement();
        this.registerDragEvents();
        this.registerClickEvent();
    }

    createElement() {
        const cartao = document.createElement('div');
        cartao.classList.add('kanban-card');
        cartao.draggable = true;
        cartao.id = this.id;

        cartao.innerHTML = `
    <h4>${this.titulo}</h4>
    <span class="edit-icon">✏️</span>
  `;
        return cartao;
    }


    registerDragEvents() {
        this.element.addEventListener('dragstart', (e) => {

            e.target.classList.add('is-dragging');

            e.dataTransfer.setData('text/plain', this.id);
        });

        this.element.addEventListener('dragend', (e) => {

            e.target.classList.remove('is-dragging');
        });
    }

    registerClickEvent() {
        const icon = this.element.querySelector('.edit-icon');

        icon.addEventListener('click', (e) => {
            e.stopPropagation();

            abrirModalDeEdicao(this);
        });
    }

    atualizarVisual(novoTitulo) {
        this.titulo = novoTitulo;
        this.element.querySelector('h4').textContent = novoTitulo;
    }
}


/**
 * =================================================================
 * CLASSE 3: Column
 * Representa uma única coluna ("A Fazer", "Fazendo", "Feito").
 * =================================================================
 */
class Column {
    constructor(status) {
        this.status = status; // Ex: "A Fazer"

        // Encontra o elemento <div> que conterá os cartões
        this.cardsContainer = document.querySelector(`[data-status="${this.status}"]`);

        // Adiciona os eventos de "soltar" (drop)
        this.registerDropEvents();
    }

    // Método para adicionar uma instância de Card na coluna
    addCard(cardInstance) {
        this.cardsContainer.appendChild(cardInstance.element);
    }

    // Método que registra os eventos de "soltar" na coluna
    registerDropEvents() {
        this.cardsContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessário para permitir o "drop"
        });

        this.cardsContainer.addEventListener('drop', async (e) => {
            e.preventDefault();

            // Pega o ID da tarefa que foi "solta" aqui
            const taskId = e.dataTransfer.getData('text/plain');

            // Encontra o elemento do cartão que está sendo arrastado
            const cardElement = document.getElementById(taskId);

            // 1. Ação Visual (Imediata): Move o cartão para esta coluna
            this.cardsContainer.appendChild(cardElement);

            // 2. Ação Lógica (Backend): Atualiza o status no banco de dados
            // O "novo status" é o status desta coluna
            console.log(`Movendo tarefa ${taskId} para ${this.status}`);
            await KanbanAPI.updateTaskDetails(taskId, { status: this.status });
        });
    }
}


/**
 * =================================================================
 * INICIALIZAÇÃO DO SCRIPT (O main) 
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', () => {


    let idProjetoCarregado = null;

    const colunaAFazer = new Column('A Fazer');
    const colunaFazendo = new Column('Fazendo');
    const colunaFeito = new Column('Feito');
    const formNovaTarefa = document.querySelector('.add-task-form');
    const inputNovaTarefa = document.querySelector('.task-input');

    const btnLogout = document.getElementById('logout-btn');

    const modalSemProjeto = document.getElementById('no-project-modal');
    const formCriarProjeto = document.getElementById('create-project-form');
    const inputNomeProjeto = document.getElementById('project-name');

    const modalEditarTarefa = document.getElementById('edit-modal');
    const inputIdTarefa = document.getElementById('edit-task-id');
    const inputTituloTarefa = document.getElementById('edit-task-title');
    const inputDescTarefa = document.getElementById('edit-task-desc');
    const btnSalvar = document.getElementById('save-edit-btn');
    const btnCancelar = document.getElementById('cancel-edit-btn');
    const btnExcluir = document.getElementById('delete-task-btn');

    let cartaoSendoEditado = null;


    async function carregarQuadro(projetoId) {
        console.log("Carregando tarefas do projeto:", projetoId);


        document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');

        const tarefas = await KanbanAPI.getTasks(projetoId);
        for (const tarefa of tarefas) {
            const card = new Card(tarefa._id, tarefa.titulo, tarefa.descricao);
            if (tarefa.status === 'A Fazer') colunaAFazer.addCard(card);
            else if (tarefa.status === 'Fazendo') colunaFazendo.addCard(card);
            else if (tarefa.status === 'Feito') colunaFeito.addCard(card);
        }
    }


    window.abrirModalDeEdicao = async (cardInstance) => {
        cartaoSendoEditado = cardInstance;
        const dadosTarefa = await KanbanAPI.getTaskDetails(cardInstance.id);
        inputIdTarefa.value = dadosTarefa._id;
        inputTituloTarefa.value = dadosTarefa.titulo;
        inputDescTarefa.value = dadosTarefa.descricao || '';
        modalEditarTarefa.style.display = 'flex';
    }
    function fecharModalDeEdicao() {
        modalEditarTarefa.style.display = 'none';
        cartaoSendoEditado = null;
    }


    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('devplanner_token');
        window.location.href = 'login.html';
    });


    formCriarProjeto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = inputNomeProjeto.value;
        if (!nome) return;

        const novoProjeto = await KanbanAPI.createProject(nome);
        if (novoProjeto) {
            idProjetoCarregado = novoProjeto._id;
            modalSemProjeto.style.display = 'none';
            await carregarQuadro(idProjetoCarregado);
        }
    });


    formNovaTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = inputNovaTarefa.value;
        if (!titulo || !idProjetoCarregado) return;

        const novaTarefa = await KanbanAPI.createTask(idProjetoCarregado, titulo);
        if (novaTarefa) {
            const card = new Card(novaTarefa._id, novaTarefa.titulo, '');
            colunaAFazer.addCard(card);
            inputNovaTarefa.value = '';
        }
    });

    // Eventos do Modal de Edição
    btnCancelar.addEventListener('click', fecharModalDeEdicao);

    btnSalvar.addEventListener('click', async () => {
        const id = inputIdTarefa.value;
        const novoTitulo = inputTituloTarefa.value;
        const novaDescricao = inputDescTarefa.value;
        if (!novoTitulo) return alert("O título não pode ficar vazio!");

        await KanbanAPI.updateTaskDetails(id, { titulo: novoTitulo, descricao: novaDescricao });
        if (cartaoSendoEditado) {
            cartaoSendoEditado.atualizarVisual(novoTitulo);
            cartaoSendoEditado.descricao = novaDescricao;
        }
        fecharModalDeEdicao();
    });

    btnExcluir.addEventListener('click', async () => {
        if (!confirm('Tem certeza?')) return;
        const id = inputIdTarefa.value;
        const sucesso = await KanbanAPI.deleteTask(id);
        if (sucesso && cartaoSendoEditado) {
            cartaoSendoEditado.element.remove();
            fecharModalDeEdicao();
        } else {
            alert("Houve um erro ao excluir a tarefa.");
        }
    });


    async function inicializarApp() {
        const projetos = await KanbanAPI.getProjects();

        if (projetos.length === 0) {

            modalSemProjeto.style.display = 'flex';
        } else {
            idProjetoCarregado = projetos[0]._id;
            await carregarQuadro(idProjetoCarregado);

        }
    }

    inicializarApp();

}); 