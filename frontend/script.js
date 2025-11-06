const API_URL = 'http://localhost:3000';

const ID_PROJETO_ATUAL = '690bab1ae81e2794acc40ba1';

/**
 * =================================================================
 * CLASSE 1: KanbanAPI
 * Classe estática para centralizar toda a comunicação com o backend.
 * Não precisamos de "new KanbanAPI()", usamos os métodos direto.
 * =================================================================
 */
class KanbanAPI {

    // Método para buscar todas as tarefas de um projeto
    static async getTasks(projetoId) {
        try {
            const response = await fetch(`${API_URL}/projetos/${projetoId}/tarefas`);
            if (!response.ok) {
                throw new Error('Erro ao buscar tarefas da API.');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro em getTasks:', error);
            return []; // Retorna um array vazio em caso de erro
        }
    }

    // Método para criar uma nova tarefa
    static async createTask(projetoId, titulo) {
        const novaTarefa = {
            titulo: titulo,
            projeto: projetoId,
            status: "A Fazer" // Novas tarefas sempre começam aqui
        };

        try {
            const response = await fetch(`${API_URL}/tarefas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaTarefa)
            });
            if (!response.ok) {
                throw new Error('Erro ao criar tarefa na API.');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro em createTask:', error);
        }
    }

    // Método para atualizar o status de uma tarefa (mover)
    static async updateTaskStatus(taskId, novoStatus) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus })
            });
            if (!response.ok) {
                throw new Error('Erro ao atualizar status da tarefa.');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro em updateTaskStatus:', error);
        }
    }

    static async getTaskDetails(taskId) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar detalhes da tarefa.');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro em getTaskDetails:', error);
        }
    }

    static async updateTaskDetails(taskId, titulo, descricao) {
        const campos = { titulo: titulo, descricao: descricao };
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campos)
            });
            if (!response.ok) {
                throw new Error('Erro ao atualizar detalhes da tarefa.');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro em updateTaskDetails:', error);
        }
    }



    static async deleteTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/tarefas/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                // 204 (No Content) é uma resposta de sucesso, 
                // então checamos se NÃO for 204 e NÃO for 200
                if (response.status !== 204 && response.status !== 200) {
                    throw new Error('Erro ao excluir tarefa na API.');
                }
            }
            return true; // Sucesso
        } catch (error) {
            console.error('Erro em deleteTask:', error);
            return false;
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
        this.descricao = descricao || ''; // Salva a descrição (ou string vazia)

        this.element = this.createElement();
        this.registerDragEvents(); // Eventos de arrastar
        this.registerClickEvent(); // Evento de clique para editar
    }

    // Método que cria e retorna o <div> do cartão
    createElement() {
        const cartao = document.createElement('div');
        cartao.classList.add('kanban-card');
        cartao.draggable = true;
        cartao.id = this.id; // Guarda o ID da tarefa no elemento
        cartao.innerHTML = `<h4>${this.titulo}</h4>`;
        return cartao;
    }

    // Método que registra os eventos de drag no elemento
    registerDragEvents() {
        this.element.addEventListener('dragstart', (e) => {
            // Adiciona uma classe CSS para feedback visual
            e.target.classList.add('is-dragging');
            // Guarda o ID da tarefa que está sendo arrastada
            e.dataTransfer.setData('text/plain', this.id);
        });

        this.element.addEventListener('dragend', (e) => {
            // Limpa a classe de feedback visual
            e.target.classList.remove('is-dragging');
        });
    }

    registerClickEvent() {
        this.element.addEventListener('click', () => {
            // Função global que vai controlar o modal (veremos abaixo)
            abrirModalDeEdicao(this);
        });
    }

    // Novo método para atualizar o visual do cartão após salvar
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
            await KanbanAPI.updateTaskStatus(taskId, this.status);
        });
    }
}


/**
 * =================================================================
 * INICIALIZAÇÃO DO SCRIPT (O "main")
 * Agora, TUDO acontece dentro do "DOMContentLoaded"
 * =================================================================
 */

// Ponto de entrada: Só executa quando o HTML estiver 100% carregado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Inicializa as três colunas
    const colunaAFazer = new Column('A Fazer');
    const colunaFazendo = new Column('Fazendo');
    const colunaFeito = new Column('Feito');

    // 2. Carrega as tarefas da API
    async function carregarQuadro() {
        console.log("Carregando tarefas do projeto:", ID_PROJETO_ATUAL);
        const tarefas = await KanbanAPI.getTasks(ID_PROJETO_ATUAL);

        for (const tarefa of tarefas) {
            const card = new Card(tarefa._id, tarefa.titulo, tarefa.descricao);

            if (tarefa.status === 'A Fazer') {
                colunaAFazer.addCard(card);
            } else if (tarefa.status === 'Fazendo') {
                colunaFazendo.addCard(card);
            } else if (tarefa.status === 'Feito') {
                colunaFeito.addCard(card);
            }
        }
    }

    // 3. Registra o evento de "submit" do formulário de nova tarefa
    const form = document.querySelector('.add-task-form');
    const inputTarefa = document.querySelector('.task-input');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = inputTarefa.value;
        if (!titulo) return;

        const novaTarefa = await KanbanAPI.createTask(ID_PROJETO_ATUAL, titulo);

        if (novaTarefa) {
            const card = new Card(novaTarefa._id, novaTarefa.titulo, '');
            colunaAFazer.addCard(card);
            inputTarefa.value = '';
        }
    });

    // --- 4. LÓGICA DO MODAL DE EDIÇÃO ---
    const modal = document.getElementById('edit-modal');
    const inputId = document.getElementById('edit-task-id');
    const inputTitulo = document.getElementById('edit-task-title');
    const inputDesc = document.getElementById('edit-task-desc');
    const btnSalvar = document.getElementById('save-edit-btn');
    const btnCancelar = document.getElementById('cancel-edit-btn');
    const btnExcluir = document.getElementById('delete-task-btn');

    let cartaoSendoEditado = null;

    // Função global (dentro do DOMContentLoaded) para abrir o modal
    window.abrirModalDeEdicao = async (cardInstance) => {
        cartaoSendoEditado = cardInstance;
        const dadosTarefa = await KanbanAPI.getTaskDetails(cardInstance.id);

        inputId.value = dadosTarefa._id;
        inputTitulo.value = dadosTarefa.titulo;
        inputDesc.value = dadosTarefa.descricao || '';

        modal.style.display = 'flex';
    }

    function fecharModalDeEdicao() {
        modal.style.display = 'none';
        cartaoSendoEditado = null;
    }

    btnCancelar.addEventListener('click', fecharModalDeEdicao);

    btnSalvar.addEventListener('click', async () => {
        const id = inputId.value;
        const novoTitulo = inputTitulo.value;
        const novaDescricao = inputDesc.value;

        if (!novoTitulo) {
            alert("O título não pode ficar vazio!");
            return;
        }

        await KanbanAPI.updateTaskDetails(id, novoTitulo, novaDescricao);

        if (cartaoSendoEditado) {
            cartaoSendoEditado.atualizarVisual(novoTitulo);
            cartaoSendoEditado.descricao = novaDescricao;
        }

        fecharModalDeEdicao();
    });


    btnExcluir.addEventListener('click', async () => {
        // Pede confirmação ao usuário
        if (!confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
            return;
        }

        const id = inputId.value; // Pega o ID do campo escondido

        // 1. Ação Lógica (Backend): Chama a API para deletar
        const sucesso = await KanbanAPI.deleteTask(id);

        if (sucesso && cartaoSendoEditado) {
            // 2. Ação Visual (Frontend): Remove o cartão da tela
            cartaoSendoEditado.element.remove();

            // 3. Fecha o modal
            fecharModalDeEdicao();
        } else {
            alert("Houve um erro ao tentar excluir a tarefa.");
        }
    });

    carregarQuadro();

}); 