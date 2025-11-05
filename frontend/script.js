// --- /frontend/script.js ---

// URL da nossa API backend
const API_URL = 'http://localhost:3000'; // Onde nosso backend está rodando (Terminal 1)

// --- Seletores do DOM ---
const containers = document.querySelectorAll('.cards-container');
const form = document.querySelector('.add-task-form');
const inputTarefa = document.querySelector('.task-input');

// --- ID Fixo do Projeto (Simulação) ---
// No futuro, o usuário escolheria um projeto.
// Por agora, vamos "chumbar" (fixar) um ID de projeto.
// Você PRECISA CRIAR ESSE PROJETO PRIMEIRO NO BANCO.
// VAMOS FAZER ISSO JUNTOS NO PRÓXIMO PASSO.
// POR ENQUANTO, DEIXE UM VALOR QUALQUER SÓ PARA O CÓDIGO FUNCIONAR.
const ID_PROJETO_ATUAL = '690bab1ae81e2794acc40ba1'; // << VAMOS MUDAR ISSO!


// --- 1. Função para carregar as tarefas da API ---
async function carregarTarefas() {
    try {
        const response = await fetch(`${API_URL}/projetos/${ID_PROJETO_ATUAL}/tarefas`);
        if (!response.ok) {
            throw new Error('Erro ao buscar tarefas');
        }
        const tarefas = await response.json();

        // Limpa as colunas antes de adicionar
        containers.forEach(container => container.innerHTML = '');

        // Cria os cartões para cada tarefa
        tarefas.forEach(tarefa => {
            criarCartao(tarefa);
        });

    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

// --- 2. Função para criar o elemento HTML do cartão ---
function criarCartao(tarefa) {
    // Cria o elemento <div> para o cartão
    const cartao = document.createElement('div');
    cartao.classList.add('kanban-card');
    cartao.draggable = true; // Torna o cartão arrastável
    cartao.id = tarefa._id; // Guarda o ID da tarefa no próprio elemento
    cartao.innerHTML = `<h4>${tarefa.titulo}</h4>`; // Mostra o título

    // Adiciona eventos de "arrastar" (drag)
    cartao.addEventListener('dragstart', () => {
        cartao.classList.add('is-dragging'); // Adiciona classe visual
    });
    cartao.addEventListener('dragend', () => {
        cartao.classList.remove('is-dragging'); // Remove classe visual
    });

    // Encontra a coluna correta e adiciona o cartão
    const coluna = document.querySelector(`[data-status="${tarefa.status}"]`);
    if (coluna) {
        coluna.appendChild(cartao);
    }
}

// --- 3. Lógica de Criar Nova Tarefa ---
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    const tituloTarefa = inputTarefa.value;
    if (!tituloTarefa) return; // Não faz nada se o campo estiver vazio

    const novaTarefa = {
        titulo: tituloTarefa,
        projeto: ID_PROJETO_ATUAL,
        status: "A Fazer" // Toda nova tarefa começa em "A Fazer"
    };

    try {
        // Envia a nova tarefa para a API (Backend)
        const response = await fetch(`${API_URL}/tarefas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaTarefa)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar tarefa');
        }

        const tarefaCriada = await response.json();
        criarCartao(tarefaCriada); // Adiciona o novo cartão na tela
        inputTarefa.value = ''; // Limpa o campo de input

    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
    }
});


// --- 4. Lógica de Arrastar e Soltar (Drag and Drop) ---

// Adiciona o evento "dragover" a todas as colunas
containers.forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessário para permitir o "soltar" (drop)
        const cartaoArrastado = document.querySelector('.is-dragging');
        container.appendChild(cartaoArrastado); // Move o cartão visualmente
    });

    // Evento "drop" (soltar) - Onde o algoritmo é chamado!
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const cartaoArrastado = document.querySelector('.is-dragging');
        const novoStatus = container.getAttribute('data-status');
        const idTarefa = cartaoArrastado.id;

        // Chama a função que atualiza o backend
        atualizarStatusTarefa(idTarefa, novoStatus);
    });
});

// --- 5. O ALGORITMO: Função para atualizar o status no Backend ---
async function atualizarStatusTarefa(id, novoStatus) {
    console.log(`Movendo tarefa ${id} para ${novoStatus}`);

    try {
        const response = await fetch(`${API_URL}/tarefas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: novoStatus }) // Envia o novo status
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar tarefa.');
        }

        const tarefaAtualizada = await response.json();
        console.log('Tarefa atualizada:', tarefaAtualizada);

    } catch (error) {
        console.error('Erro ao mover tarefa:', error);
        // (Opcional: mover o cartão de volta se a API falhar)
    }
}


// --- Inicialização ---
// Carrega as tarefas quando a página abre
document.addEventListener('DOMContentLoaded', carregarTarefas);