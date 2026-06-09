// Seleção de elementos do DOM
const form = document.getElementById('finance-form');
const clientNameInput = document.getElementById('client-name');
const amountInput = document.getElementById('amount');
const serviceTypeInput = document.getElementById('service-type');
const paymentMethodInput = document.getElementById('payment-method');
const dateInput = document.getElementById('date');
const recordsTableBody = document.querySelector('#records-table tbody');
const totalAmountSpan = document.getElementById('total-amount');

// Elementos dos Modais
const confirmModal = document.getElementById('confirm-modal');
const btnConfirmYes = document.getElementById('btn-confirm-yes');
const btnConfirmNo = document.getElementById('btn-confirm-no');

const saveModal = document.getElementById('save-modal');
const btnSaveYes = document.getElementById('btn-save-yes');
const btnSaveNo = document.getElementById('btn-save-no');

const historicModal = document.getElementById('historic-modal');
const btnCloseHistoric = document.getElementById('btn-close-historic');
const historicListDiv = document.getElementById('historic-list');

// Elementos dos Botões Principais
const btnSaveData = document.getElementById('btnSaveData');
const btnShare = document.getElementById('btnShare');
const btnHistoric = document.getElementById('historic');

// Variáveis de controle
let indexToDelete = null;

// Carregar dados do localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let historicMonths = JSON.parse(localStorage.getItem('historicMonths')) || [];

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Atualizar a interface da tabela ativa
function updateUI() {
    recordsTableBody.innerHTML = '';
    let total = 0;

    const reversedTransactions = [...transactions].reverse();

    reversedTransactions.forEach((transaction, reversedIndex) => {
        const originalIndex = transactions.length - 1 - reversedIndex;
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.client}</td>
            <td>${transaction.service || 'Não informado'}</td>
            <td>${transaction.method}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td><button class="delete-btn" onclick="askDeleteTransaction(${originalIndex})">Excluir</button></td>
        `;
        recordsTableBody.appendChild(row);
    });

    transactions.forEach(t => total += t.amount);
    totalAmountSpan.textContent = formatCurrency(total);
}

// Formulário para adicionar transação
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTransaction = {
        client: clientNameInput.value,
        amount: parseFloat(amountInput.value),
        service: serviceTypeInput.value,
        method: paymentMethodInput.value,
        date: dateInput.value
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    form.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
});

// Modal de exclusão de serviço simples
window.askDeleteTransaction = function(index) {
    indexToDelete = index;
    confirmModal.classList.add('active');
};

btnConfirmYes.addEventListener('click', () => {
    if (indexToDelete !== null) {
        transactions.splice(indexToDelete, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
    }
    closeModal();
});

btnConfirmNo.addEventListener('click', () => closeModal());

function closeModal() {
    confirmModal.classList.remove('active');
    indexToDelete = null;
}

// ================= LÓGICA DO MODAL PARA SALVAR MÊS =================
btnSaveData.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert('Não há transações na tabela atual para salvar no histórico.');
        return;
    }
    saveModal.classList.add('active'); 
});

btnSaveYes.addEventListener('click', () => {
    let totalMes = 0;
    transactions.forEach(t => totalMes += t.amount);

    const novoHistorico = {
        dataSalvamento: new Date().toLocaleDateString('pt-BR'),
        total: totalMes,
        quantidadeServicos: transactions.length,
        detalhes: [...transactions]
    };

    historicMonths.push(novoHistorico);
    localStorage.setItem('historicMonths', JSON.stringify(historicMonths));

    transactions = [];
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    saveModal.classList.remove('active');
    renderHistoricList(); 
});

btnSaveNo.addEventListener('click', () => {
    saveModal.classList.remove('active');
});

// ================= GERAÇÃO E GERENCIAMENTO DO HISTÓRICO MENSAL =================
function renderHistoricList() {
    historicListDiv.innerHTML = '';

    if (historicMonths.length === 0) {
        historicListDiv.innerHTML = '<p style="color: #666; text-align: center;">Nenhum mês foi arquivado ainda.</p>';
        return;
    }

    const reversedHistoric = [...historicMonths].reverse();

    reversedHistoric.forEach((hist, reversedIndex) => {
        const originalIndex = historicMonths.length - 1 - reversedIndex;

        const item = document.createElement('div');
        item.className = 'historic-item';
        item.innerHTML = `
            <div class="historic-info">
                <strong>📦 Fechamento em:</strong> ${hist.dataSalvamento}<br>
                <strong>🔢 Atendimentos:</strong> ${hist.quantidadeServicos}<br>
                <strong>💰 Total:</strong> <span style="color: #0077b6; font-weight: bold;">${formatCurrency(hist.total)}</span>
            </div>
            <div class="historic-actions">
                <button class="hist-btn-share" onclick="shareHistoricMonth(${originalIndex})" title="Compartilhar este relatório">
                    <i class="fa-solid fa-share-from-square"></i>
                </button>
                <button class="hist-btn-delete" onclick="deleteHistoricMonth(${originalIndex})" title="Excluir este mês">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        historicListDiv.appendChild(item);
    });
}

btnHistoric.addEventListener('click', () => {
    renderHistoricList();
    historicModal.classList.add('active');
});

btnCloseHistoric.addEventListener('click', () => {
    historicModal.classList.remove('active');
});

window.deleteHistoricMonth = function(index) {
    if (confirm("Tem certeza de que deseja excluir permanentemente este mês do histórico?")) {
        historicMonths.splice(index, 1);
        localStorage.setItem('historicMonths', JSON.stringify(historicMonths));
        renderHistoricList(); 
    }
};

// ================= FUNÇÃO CENTRAL DE COMPARTILHAMENTO (CORRIGIDA) =================
function gerarTextoRelatorio(lista, titulo, dataEnvio, total) {
    let texto = `*📊 ${titulo}*\n`;
    texto += `Data de Fechamento/Envio: ${dataEnvio}\n`;
    texto += `------------------------------------------\n\n`;

    const reversed = [...lista].reverse();
    reversed.forEach((t) => {
        const valorFormatado = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Verifica se a data veio no padrão HTML (AAAA-MM-DD) ou se já está formatada no histórico
        let dataExibicao = t.date;
        if (t.date && t.date.includes('-')) {
            const [ano, mes, dia] = t.date.split('-');
            dataExibicao = `${dia}/${mes}/${ano}`;
        }
        
        texto += `📅 *Data:* ${dataExibicao}\n`;
        texto += `👤 *Cliente:* ${t.client}\n`;
        texto += `✨ *Serviço:* ${t.service || 'Não informado'}\n`;
        texto += `💳 *Pagamento:* ${t.method}\n`;
        texto += `💰 *Valor:* ${valorFormatado}\n`;
        texto += `------------------------------------------\n`;
    });

    texto += `\n*✅ TOTAL DO PERÍODO: ${formatCurrency(total)}*`;
    return texto;
}

function dispararCompartilhamento(texto) {
    // Tenta usar o compartilhamento nativo em smartphones, se falhar ou estiver no PC, abre o WhatsApp Web
    if (navigator.share) {
        navigator.share({ title: 'Relatório Financeiro', text: texto })
        .catch((error) => {
            const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
            window.open(urlWhatsApp, '_blank');
        });
    } else {
        const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
        window.open(urlWhatsApp, '_blank');
    }
}

// Botão Compartilhar Mês Atual
btnShare.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert('Não há dados ativos para compartilhar no momento.');
        return;
    }
    let totalAcumulado = 0;
    transactions.forEach(t => totalAcumulado += t.amount);

    const texto = gerarTextoRelatorio(
        transactions, 
        'RELATÓRIO FINANCEIRO - MÊS CORRENTE', 
        new Date().toLocaleDateString('pt-BR'), 
        totalAcumulado
    );
    dispararCompartilhamento(texto);
});

// Compartilhar mês específico do Histórico
window.shareHistoricMonth = function(index) {
    const hist = historicMonths[index];
    const texto = gerarTextoRelatorio(
        hist.detalhes, 
        `RELATÓRIO HISTÓRICO (${hist.dataSalvamento})`, 
        hist.dataSalvamento, 
        hist.total
    );
    dispararCompartilhamento(texto);
};

// Inicialização
dateInput.value = new Date().toISOString().split('T')[0];
updateUI();