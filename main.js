// main.js

// Importa os módulos do Firebase inicializados e exportados de firebase-init.js
import { auth, database } from './firebase-init.js';

// Importa as funções específicas do Firebase Realtime Database
import { ref, set, push, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Importa as funções específicas do Firebase Authentication
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// --- FUNÇÕES DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS ---

/**
 * Função auxiliar para buscar a matrícula de um usuário no banco de dados.
 * @param {string} uid - O UID do usuário.
 * @returns {Promise<string>} A matrícula do usuário ou 'N/A' se não encontrada.
 */
async function getUserMatricula(uid) {
    if (!uid) return 'N/A';
    try {
        const userRef = ref(database, 'users/' + uid);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        return userData ? userData.matricula : 'N/A';
    } catch (error) {
        console.error("Erro ao buscar matrícula do usuário:", error);
        return 'N/A';
    }
}


// Lida com o estado de autenticação do usuário e atualiza a UI
onAuthStateChanged(auth, async user => {
    const userInfo = document.getElementById('user-info');
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutBtn = document.getElementById('logout-btn');

    const protectedPaths = ['dashboard.html', 'products.html', 'historico_posicoes.html', 'buscar_posicao.html'];
    const currentPath = window.location.pathname.split('/').pop();

    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, async (snapshot) => {
            const userData = snapshot.val();
            let userInfoText = `Bem-vindo, `;
            let matricula = 'N/A';
            let userNameToDisplay = user.email; // Fallback para o email

            // Prioriza o nome do Realtime Database (onde o nome completo é salvo)
            if (userData && userData.username) {
                userNameToDisplay = userData.username;
            } else if (user.displayName) { // Se não tiver no DB, tenta o displayName do Auth
                userNameToDisplay = user.displayName;
            }
            
            if (userData && userData.matricula) {
                matricula = userData.matricula;
            } else {
                matricula = await getUserMatricula(user.uid);
            }
            
            userInfoText += `${userNameToDisplay} (Matrícula: ${matricula})`;
            if (userInfo) {
    if (userInfo) {
    userInfo.textContent = userInfoText;
}
}
        }, {
            onlyOnce: true
        });

        navLinks.forEach(link => link.style.display = 'block');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }

        if (currentPath === 'index.html' || currentPath === 'register.html') {
            window.location.href = 'dashboard.html';
        }

        // Chama funções de atualização de tabelas se estiver no dashboard
        if (currentPath === 'dashboard.html') {
            updateRecentActivitiesTable();
            loadPositions(); // Garante que as posições sejam carregadas para o seletor
        }
        if (currentPath === 'products.html') {
            renderRealtimeProducts();
        }
        if (currentPath === 'historico_posicoes.html') {
            updateRemovedItemsTable();
        }

    } else {
        if (userInfo) {
    userInfo.textContent = 'Você não está logado.';
}

        navLinks.forEach(link => link.style.display = 'none');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }

        if (protectedPaths.includes(currentPath)) {
            window.location.href = 'index.html';
        }
    }
});

// Lida com o formulário de Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            displayMessage('Login efetuado com sucesso!', 'success');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Erro de login:', error);
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Email ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'O formato do email é inválido.';
            }
            displayMessage(errorMessage, 'error');
        }
    });
}

// Lida com o formulário de Registro
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('register-username').value;
      const name = document.getElementById('register-name').value;
      const matricula = document.getElementById('register-matricula').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      if (!email || !name || !matricula || !password || !confirmPassword) {
        alert('Todos os campos são obrigatórios.');
        return;
      }

      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      try {
        console.log("📥 Criando usuário...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Usuário criado:", user.uid);

        await updateProfile(user, { displayName: name });
        console.log("✏️ Nome atualizado para:", name);

        await firebaseSet(firebaseRef(firebaseDB, 'users/' + user.uid), {
          email: user.email,
          username: name,
          matricula: matricula
        });
        console.log("📦 Dados gravados no Firebase DB!");

        alert('Usuário registrado com sucesso!');
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error("❌ Erro ao registrar:", error);
        alert('Erro ao registrar: ' + error.message);
      }
    });
  }
});



// Lida com o botão de Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        displayMessage('Logout efetuado.', 'info');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Erro ao fazer logout:', error);
        displayMessage('Erro ao fazer logout: ' + error.message, 'error');
    });
});


// --- FUNÇÕES DE GERENCIAMENTO DE ESTOQUE E OUTRAS PÁGINAS ---

// Função para exibir mensagens ao usuário (substitui alert())
function displayMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) {
        console.warn('Elemento #message-box não encontrado. A mensagem não será exibida na UI.');
        console.log(`Mensagem: ${message} (Tipo: ${type})`);
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
        messageBox.textContent = '';
        messageBox.className = 'message-box';
    }, 5000);
}

// Função para carregar posições no seletor (para dashboard.html)

const loadPositions = () => {
    const positionSelect = document.getElementById('product-position');
    if (positionSelect) {
        positionSelect.innerHTML = '<option value="" disabled selected>Selecione a posição</option>';
        const positionsRef = ref(database, 'positions');
        onValue(positionsRef, (snapshot) => {
            const positions = [];

            snapshot.forEach((childSnapshot) => {
                const key = childSnapshot.key;
                const value = childSnapshot.val();
                positions.push({ key, value });
            });

            // Ordena as posições por RUA, COLUNA e POSIÇÃO
            positions.sort((a, b) => {
                const regex = /RUA (\d+) COLUNA (\d+) POSIÇÃO ([A-Z])/;
                const [, ruaA, colunaA, posA] = a.key.match(regex);
                const [, ruaB, colunaB, posB] = b.key.match(regex);
                if (parseInt(ruaA) !== parseInt(ruaB)) {
                    return parseInt(ruaA) - parseInt(ruaB);
                }
                if (parseInt(colunaA) !== parseInt(colunaB)) {
                    return parseInt(colunaA) - parseInt(colunaB);
                }
                return posA.localeCompare(posB);
            });

            // Adiciona ao <select>
            positions.forEach(({ key, value }) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value.name || key;
                positionSelect.appendChild(option);
            });
        }, {
            onlyOnce: true
        });
    }
};


// Função para renderizar produtos em tempo real (para products.html)
const renderRealtimeProducts = () => {
    const tableBody = document.querySelector('#realtime-products-table tbody');
    if (tableBody) {
        tableBody.innerHTML = '';

        const productsRef = ref(database, 'products');
        onValue(productsRef, (snapshot) => {
            tableBody.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = product.sku;
                row.insertCell(1).textContent = product.name;
                row.insertCell(2).textContent = product.lote;
                row.insertCell(3).textContent = product.date;
                row.insertCell(4).textContent = product.quantity;
                row.insertCell(5).textContent = product.position;
                row.insertCell(6).textContent = product.modifiedBy || 'N/A';

                const actionsCell = row.insertCell(7);
                // Botão "Pegar Posição" (move para o histórico)
                const takeBtn = document.createElement('button');
                takeBtn.textContent = 'Pegar Posição';
                takeBtn.classList.add('take-btn');
                takeBtn.addEventListener('click', () => takeProductFromPosition(childSnapshot.key, product));
                actionsCell.appendChild(takeBtn);

                // Botão "Remover do Estoque" (remove definitivamente)
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remover do Estoque';
                removeBtn.classList.add('remove-btn');
                removeBtn.addEventListener('click', () => removeProduct(childSnapshot.key, product));
                actionsCell.appendChild(removeBtn);
            });
        });
    }
};

// Função para adicionar produto ao estoque
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const sku = document.getElementById('product-sku').value;
        const name = document.getElementById('product-name').value;
        const lote = document.getElementById('product-lote').value;
        const date = document.getElementById('product-date').value;
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const position = document.getElementById('product-position').value;

        if (quantity <= 0) {
            displayMessage('A quantidade deve ser maior que zero.', 'error');
            return;
        }

        // --- VERIFICAÇÃO DE POSIÇÃO ÚNICA E SUBSTITUIÇÃO ---
        try {
            const productsRef = ref(database, 'products');
            const snapshot = await get(productsRef);
            let existingProductInPosition = null;
            let existingProductId = null;

            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                if (product.position === position) {
                    existingProductInPosition = product;
                    existingProductId = childSnapshot.key;
                    return; // Sai do forEach
                }
            });

            if (existingProductInPosition) {
                // Posição ocupada, notificar e perguntar ao usuário
                displayMessage(`A posição "${position}" já está ocupada pelo produto "${existingProductInPosition.name}" (SKU: ${existingProductInPosition.sku}).`, 'info');

                showConfirmModal(
                    `A posição "${position}" já está ocupada pelo produto "${existingProductInPosition.name}" (SKU: ${existingProductInPosition.sku}). ` +
                    `Tem certeza que deseja adicionar este novo produto nesta posição? ` +
                    `O produto atual será removido da posição e o novo produto ficará no lugar dele.`,
                    async () => {
                        // Usuário confirmou a substituição
                        try {
                            const user = auth.currentUser;
                            let actionBy = 'Desconhecido';
                            if (user) {
                                const matricula = await getUserMatricula(user.uid);
                                actionBy = `${user.displayName || user.email} (Matrícula: ${matricula})`;
                            }

                            // 1. Mover o produto existente para o histórico de removidos (como substituído)
                            const removedItemsRef = ref(database, 'removed_items');
                            await push(removedItemsRef, {
                                ...existingProductInPosition,
                                removedBy: actionBy,
                                removedTimestamp: new Date().toISOString(),
                                actionType: 'Substituído por novo produto'
                            });

                            // 2. Remover o produto existente da coleção 'products'
                            await set(ref(database, 'products/' + existingProductId), null);

                            // 3. Adicionar o novo produto na mesma posição
                            const newProductRef = push(productsRef); // Gera um novo ID para o novo produto
                            await set(newProductRef, {
                                sku,
                                name,
                                lote,
                                date,
                                quantity,
                                position,
                                modifiedBy: actionBy, // Quem adicionou o novo produto
                                timestamp: new Date().toISOString()
                            });

                            displayMessage('Produto adicionado com sucesso! O produto anterior foi substituído e movido para o histórico.', 'success');
                            addProductForm.reset(); // Limpa o formulário
                        } catch (error) {
                            console.error('Erro ao substituir produto na posição:', error);
                            displayMessage('Erro ao substituir produto na posição: ' + error.message, 'error');
                        }
                    },
                    () => {
                        // Usuário cancelou
                        displayMessage('Operação de adição de produto cancelada.', 'info');
                    }
                );
                return; // Impede a adição imediata, aguarda a confirmação do modal
            }

            // Se a posição NÃO estiver ocupada, prossegue com a adição normal do produto
            const newProductRef = push(productsRef);
            const user = auth.currentUser;
            let modifiedBy = 'Desconhecido';
    if (user) {
        const matricula = await getUserMatricula(user.uid);
        modifiedBy = `${user.displayName || user.email} (Matrícula: ${matricula})`;
    }
            if (user) {
                const matricula = await getUserMatricula(user.uid);
                modifiedBy = `${user.displayName || user.email} (Matrícula: ${matricula})`;
            }

            await set(newProductRef, {
                sku,
                name,
                lote,
                date,
                quantity,
                position,
                modifiedBy: modifiedBy,
                timestamp: new Date().toISOString()
            });

            displayMessage('Produto adicionado com sucesso!', 'success');
            addProductForm.reset();
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            displayMessage('Erro ao adicionar produto: ' + error.message, 'error');
        }
    });
}

/**
 * Função para remover um produto definitivamente do estoque.
 * Não registra no histórico de itens removidos.
 * @param {string} productId - A chave do produto no Firebase.
 * @param {object} productData - Os dados do produto a ser removido.
 */
const removeProduct = async (productId, productData) => {
    showConfirmModal(`Tem certeza que deseja REMOVER DEFINITIVAMENTE ${productData.name} (SKU: ${productData.sku}) do estoque?`, async () => {
        try {
            const productRef = ref(database, 'products/' + productId);
            await set(productRef, null); // Define como null para remover

            displayMessage('Produto removido definitivamente do estoque!', 'success');
        } catch (error) {
            console.error('Erro ao remover produto definitivamente:', error);
            displayMessage('Erro ao remover produto definitivamente: ' + error.message, 'error');
        }
    });
};

/**
 * Função para "pegar" um produto da posição, movendo-o para o histórico de retiradas.
 * O item é removido da lista de produtos em tempo real e adicionado ao histórico.
 * @param {string} productId - A chave do produto no Firebase.
 * @param {object} productData - Os dados do produto a ser movido.
 */
const takeProductFromPosition = async (productId, productData) => {
    showConfirmModal(`Tem certeza que deseja PEGAR ${productData.name} (SKU: ${productData.sku}) da posição e registrá-lo no histórico de retiradas?`, async () => {
        try {
            const productRef = ref(database, 'products/' + productId);
            const removedItemsRef = ref(database, 'removed_items');
            const newRemovedItemRef = push(removedItemsRef);

            const user = auth.currentUser;
            let removedBy = 'Desconhecido';
    if (user) {
        const matricula = await getUserMatricula(user.uid);
        removedBy = `${user.displayName || user.email} (Matrícula: ${matricula})`;
    }
            if (user) {
                const matricula = await getUserMatricula(user.uid);
                removedBy = `${user.displayName || user.email} (Matrícula: ${matricula})`;
            }

            // Salva o item removido no histórico de retiradas
            await set(newRemovedItemRef, {
                ...productData,
                removedBy: removedBy,
                removedTimestamp: new Date().toISOString(),
                actionType: 'Pegar Posição' // Novo campo para diferenciar
            });

            // Remove o item da tabela de produtos em tempo real
            await set(productRef, null);

            displayMessage('Produto pegado da posição e registrado no histórico!', 'success');
        } catch (error) {
            console.error('Erro ao pegar produto da posição:', error);
            displayMessage('Erro ao pegar produto da posição: ' + error.message, 'error');
        }
    });
};


// Função para mostrar um modal de confirmação (substitui confirm())
function showConfirmModal(message, onConfirm, onCancel = () => {}) { // Adicionado onCancel
    const modal = document.createElement('div');
    modal.classList.add('confirm-modal');
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <p>${message}</p>
            <div class="confirm-modal-actions">
                <button id="confirm-yes">Sim</button>
                <button id="confirm-no">Não</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-yes').addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });

    document.getElementById('confirm-no').addEventListener('click', () => {
        onCancel(); // Chama onCancel se o usuário clicar em 'Não'
        modal.remove();
    });
}


// Função para buscar SKU (para dashboard.html e buscar_posicao.html)
const skuSearchInput = document.getElementById('sku-search');
const searchBtn = document.getElementById('search-btn');
const searchResultsTableBody = document.querySelector('#search-results-table tbody');

if (skuSearchInput && searchBtn && searchResultsTableBody) {
    searchBtn.addEventListener('click', async () => {
        const skuToSearch = skuSearchInput.value.trim();
        searchResultsTableBody.innerHTML = '';

        if (skuToSearch === '') {
            displayMessage('Por favor, digite um SKU para buscar.', 'info');
            return;
        }

        try {
            const productsRef = ref(database, 'products');
            const snapshot = await get(productsRef);

            let found = false;
            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                if (product.sku && product.sku.toLowerCase() === skuToSearch.toLowerCase()) {
                    const row = searchResultsTableBody.insertRow();
                    row.insertCell(0).textContent = product.sku;
                    row.insertCell(1).textContent = product.name;
                    row.insertCell(2).textContent = product.lote;
                    row.insertCell(3).textContent = product.date;
                    row.insertCell(4).textContent = product.quantity;
                    row.insertCell(5).textContent = product.position;
                    row.insertCell(6).textContent = product.modifiedBy || 'N/A';
                    row.insertCell(7).textContent = product.timestamp ? new Date(product.timestamp).toLocaleString() : 'N/A';
                    const actionsCell = row.insertCell(8);
                    const takeBtn = document.createElement('button');
                    takeBtn.textContent = 'Pegar Posição';
                    takeBtn.classList.add('take-btn');
                    takeBtn.addEventListener('click', () => takeProductFromPosition(childSnapshot.key, product));
                    actionsCell.appendChild(takeBtn);

                    found = true;
                }
            });

            
if (!found) {
    // Verifica se existe no products_data como uma "tag"
    const tagsRef = ref(database, 'products_data');
    const tagsSnapshot = await get(tagsRef);
    const tagData = tagsSnapshot.val();

    if (tagData && tagData[skuToSearch]) {
        const row = searchResultsTableBody.insertRow();
        row.insertCell(0).textContent = skuToSearch;
        row.insertCell(1).textContent = tagData[skuToSearch].descricao || 'Descrição não disponível';
        row.insertCell(2).textContent = '-';
        row.insertCell(3).textContent = '-';
        row.insertCell(4).textContent = '-';
        row.insertCell(5).textContent = '-';
        row.insertCell(6).textContent = '-';
        row.insertCell(7).textContent = 'TAG (products_data)';
        found = true;
    }
}

        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            displayMessage('Erro ao buscar produto: ' + error.message, 'error');
        }
    });
}

/**
 * Função para atualizar a tabela de Últimas Atividades (dashboard.html)
 * Exibe um histórico combinado de adições, remoções, "pegar posição" e substituições.
 */
const updateRecentActivitiesTable = () => {
    const recentActivitiesTableBody = document.querySelector('#recent-activities-table tbody');
    if (recentActivitiesTableBody) {
        recentActivitiesTableBody.innerHTML = ''; // Limpa a tabela

        const productsRef = ref(database, 'products');
        const removedItemsRef = ref(database, 'removed_items');

        // Observa as alterações em ambos os nós
        onValue(productsRef, (productsSnapshot) => {
            onValue(removedItemsRef, (removedItemsSnapshot) => {
                let allActivities = [];

                // Coleta atividades de produtos (adições/modificações)
                productsSnapshot.forEach((childSnapshot) => {
                    const product = childSnapshot.val();
                    allActivities.push({
                        sku: product.sku,
                        name: product.name,
                        position: product.position,
                        quantity: product.quantity,
                        actionType: 'Adicionado/Atualizado', // Pode refinar se houver lógica de atualização
                        actedBy: product.modifiedBy || 'N/A',
                        timestamp: product.timestamp ? new Date(product.timestamp) : new Date(0) // Usar Date object para ordenação
                    });
                });

                // Coleta atividades de itens removidos/substituídos
                removedItemsSnapshot.forEach((childSnapshot) => {
                    const item = childSnapshot.val();
                    allActivities.push({
                        sku: item.sku,
                        name: item.name,
                        position: item.position,
                        quantity: item.quantity,
                        actionType: item.actionType || 'Removido', // Usa o actionType salvo ou 'Removido'
                        actedBy: item.removedBy || 'N/A',
                        timestamp: item.removedTimestamp ? new Date(item.removedTimestamp) : new Date(0)
                    });
                });

                // Ordena todas as atividades pela data/hora mais recente
                allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                // Limita às últimas N atividades (ex: 20)
                const recentActivities = allActivities.slice(0, 20); // Ajuste o número conforme necessário

                recentActivitiesTableBody.innerHTML = ''; // Limpa antes de preencher

                recentActivities.forEach((activity) => {
                    const row = recentActivitiesTableBody.insertRow();
                    row.insertCell(0).textContent = activity.sku;
                    row.insertCell(1).textContent = activity.name;
                    row.insertCell(2).textContent = activity.position;
                    row.insertCell(3).textContent = activity.quantity;
                    row.insertCell(4).textContent = activity.actionType;
                    row.insertCell(5).textContent = activity.actedBy;
                    row.insertCell(6).textContent = activity.timestamp.toLocaleString();
                });
            });
        });
    }
};

// Função para atualizar a tabela de itens removidos (historico_posicoes.html)
const updateRemovedItemsTable = () => {
    const removedItemsTableBody = document.querySelector('#removed-items-table tbody');
    if (removedItemsTableBody) {
        removedItemsTableBody.innerHTML = '';

        const removedItemsRef = ref(database, 'removed_items');
        onValue(removedItemsRef, (snapshot) => {
            removedItemsTableBody.innerHTML = '';

            snapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                const row = removedItemsTableBody.insertRow();
                row.insertCell(0).textContent = item.sku;
                row.insertCell(1).textContent = item.name;
                row.insertCell(2).textContent = item.lote;
                row.insertCell(3).textContent = item.date;
                row.insertCell(4).textContent = item.quantity;
                row.insertCell(5).textContent = item.position;
                row.insertCell(6).textContent = item.removedBy || 'N/A';
                row.insertCell(7).textContent = item.removedTimestamp ? new Date(item.removedTimestamp).toLocaleString() : 'N/A';
                row.insertCell(8).textContent = item.actionType || 'Removido'; // Exibe o tipo de ação
            });
        });
    }
};

// Adicione um pouco de CSS para o modal de mensagem e confirmação e para os novos botões
const style = document.createElement('style');
style.textContent = `
    .message-box {
        display: none;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 5px;
        font-weight: bold;
        text-align: center;
        color: white;
    }
    .message-box.success {
        background-color: #4CAF50; /* Green */
    }
    .message-box.error {
        background-color: #f44336; /* Red */
    }
    .message-box.info {
        background-color: #2196F3; /* Blue */
    }
    .confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .confirm-modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        text-align: center;
        max-width: 400px;
        width: 90%;
    }
    .confirm-modal-actions button {
        margin: 10px;
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }
    #confirm-yes {
        background-color: #4CAF50;
        color: white;
    }
    #confirm-no {
        background-color: #f44336;
        color: white;
    }

    /* Estilos para os novos botões de ação */
    .take-btn {
        background-color: #ff9800; /* Laranja */
        color: white;
        padding: 6px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 5px;
        font-size: 0.9em;
    }
    .take-btn:hover {
        background-color: #e68900;
    }
    .remove-btn { /* Já existente, mas adicionando uma cor para diferenciar */
        background-color: #f44336; /* Vermelho */
        color: white;
        padding: 6px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
    }
    .remove-btn:hover {
        background-color: #d32f2f;
    }
`;
document.head.appendChild(style);

// Adicione um elemento para exibir as mensagens na sua página HTML (ex: no topo do <body>)
// <div id="message-box" class="message-box"></div>



const skuInput = document.getElementById('product-sku');
const nameInput = document.getElementById('product-name');

if (skuInput && nameInput) {
    skuInput.addEventListener('input', async () => {
        const sku = skuInput.value.trim();

        if (sku.length === 0) {
            nameInput.value = '';
            nameInput.removeAttribute('readonly');
            return;
        }

        try {
            const tagRef = ref(database, 'products_data/' + sku);
            const snapshot = await get(tagRef);
            const tagData = snapshot.val();

            if (tagData && tagData.descricao) {
                nameInput.value = tagData.descricao;
                nameInput.setAttribute('readonly', true);
            } else {
                nameInput.value = '';
                nameInput.removeAttribute('readonly');
            }
        } catch (error) {
            console.error('Erro ao buscar descrição por SKU:', error);
            nameInput.removeAttribute('readonly');
        }
    });
}
