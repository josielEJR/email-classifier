// ------- Seletores principais -------

const sendBtn = document.getElementById("sendBtn");
const emailText = document.getElementById("emailText");

const fileInput = document.getElementById("fileInput");
const fileDropZone = document.getElementById("fileDropZone");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const removeFileBtn = document.getElementById("removeFile");

// Lote (agora integrado na tab de arquivo)
const batchStatus = document.getElementById("batchStatus");
const batchResults = document.getElementById("batchResults");
const batchTable = document.getElementById("batchTable");
const batchTbody = batchTable ? batchTable.querySelector("tbody") : null;
const clearResultsBtn = document.getElementById("clearResultsBtn");

// Resultado individual
const categorySpan = document.getElementById("category");
const categoryCard = document.getElementById("categoryCard");
const categoryIcon = document.getElementById("categoryIcon");
const categoryDescription = document.getElementById("categoryDescription");
const replyP = document.getElementById("reply");
const statusEl = document.getElementById("status");
const resultContainer = document.getElementById("result");
const closeResultBtn = document.getElementById("closeResult");
const copyBtn = document.getElementById("copyBtn");
const textPreview = document.getElementById("textPreview");
const previewContent = document.getElementById("previewContent");
const togglePreview = document.getElementById("togglePreview");
const charCount = document.getElementById("charCount");

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const textTab = document.getElementById("textTab");
const fileTab = document.getElementById("fileTab");

// Estatísticas
const statsContainer = document.getElementById("statsContainer");
const totalEmails = document.getElementById("totalEmails");
const productiveEmails = document.getElementById("productiveEmails");
const unproductiveEmails = document.getElementById("unproductiveEmails");

// Histórico
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// Toast
const toast = document.getElementById("toast");

// Estado em memória
let history = JSON.parse(localStorage.getItem("emailHistory")) || [];
let stats = JSON.parse(localStorage.getItem("emailStats")) || {
  total: 0,
  productive: 0,
  unproductive: 0,
};

// ------- Inicialização -------

document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  updateHistory();
  setupEventListeners();
  loadLastResult();
});

// ------- Utilitário: aba ativa -------

function getActiveTab() {
  const activeBtn = document.querySelector(".tab-btn.active");
  return activeBtn ? activeBtn.dataset.tab : "text";
}

// ------- CONFIGURAÇÃO DE EVENT LISTENERS -------

function setupEventListeners() {
  // Tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Contador de caracteres
  emailText.addEventListener("input", () => {
    charCount.textContent = emailText.value.length;
  });

  // Drag & drop (suporta múltiplos arquivos)
  setupDragAndDropSingle();

  // Arquivo (suporta múltiplos)
  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelectSingle);
  }
  if (removeFileBtn) {
    removeFileBtn.addEventListener("click", clearFileSingle);
  }

  // Botão principal: decide entre único ou múltiplos
  sendBtn.addEventListener("click", () => {
    const activeTab = getActiveTab();
    if (activeTab === "file" && fileInput.files.length > 1) {
      processBatch();
    } else {
      processEmail();
    }
  });

  // Limpar resultados
  if (clearResultsBtn) {
    clearResultsBtn.addEventListener("click", clearBatchResults);
  }

  // Fechar resultado individual
  closeResultBtn.addEventListener("click", () => {
    resultContainer.style.display = "none";
  });

  // Copiar resposta
  copyBtn.addEventListener("click", copyReply);

  // Expandir/recolher preview
  togglePreview.addEventListener("click", () => {
    const content = previewContent;
    const isCollapsed = content.classList.contains("collapsed");
    content.classList.toggle("collapsed");
    togglePreview.textContent = isCollapsed ? "▼" : "▲";
  });

  // Limpar histórico
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
      history = [];
      stats = { total: 0, productive: 0, unproductive: 0 };
      localStorage.removeItem("emailHistory");
      localStorage.removeItem("emailStats");
      updateStats();
      updateHistory();
      showToast("Histórico limpo com sucesso!", "success");
    }
  });

  // Atalho: Ctrl+Enter para processar email (nas abas texto/arquivo)
  emailText.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const activeTab = getActiveTab();
      if (activeTab !== "batch") {
        processEmail();
      }
    }
  });
}

// ------- Tabs -------

function switchTab(tab) {
  // Botões
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // Conteúdo das abas
  textTab.classList.toggle("active", tab === "text");
  fileTab.classList.toggle("active", tab === "file");

  // Limpezas específicas de cada aba
  if (tab === "text") {
    clearFileSingle();
  } else if (tab === "file") {
    emailText.value = "";
    charCount.textContent = "0";
    resultContainer.style.display = "none";
  }

  // Esconde status específicos quando troca de aba
  showStatus("", "info");
  showBatchStatus("", "info");
}

// ------- Drag & Drop: arquivo único -------

function setupDragAndDropSingle() {
  if (!fileDropZone) return;

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, () => {
      fileDropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, () => {
      fileDropZone.classList.remove("dragover");
    });
  });

  fileDropZone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Limitar a 6 arquivos
      const filesArray = Array.from(files).slice(0, 6);
      const dataTransfer = new DataTransfer();
      filesArray.forEach(file => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
      handleFileSelectSingle();
    }
  });

  fileDropZone.addEventListener("click", () => {
    fileInput.click();
  });
}

function handleFileSelectSingle() {
  const files = fileInput.files;
  if (files.length > 0) {
    // Limitar a 6 arquivos
    if (files.length > 6) {
      showToast("Máximo de 6 arquivos permitidos. Apenas os primeiros 6 serão processados.", "error");
      const filesArray = Array.from(files).slice(0, 6);
      const dataTransfer = new DataTransfer();
      filesArray.forEach(file => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
    }
    
    if (files.length === 1) {
      fileName.textContent = files[0].name;
    } else {
      fileName.textContent = `${files.length} arquivo(s) selecionado(s)`;
    }
    fileInfo.style.display = "flex";
    fileDropZone.style.display = "none";
  }
}

function clearFileSingle() {
  if (!fileInput) return;
  fileInput.value = "";
  if (fileInfo) fileInfo.style.display = "none";
  if (fileDropZone) fileDropZone.style.display = "block";
  if (fileName) fileName.textContent = "";
}

// ------- Limpar resultados do lote -------

function clearBatchResults() {
  if (batchTbody) batchTbody.innerHTML = "";
  if (batchResults) batchResults.style.display = "none";
  showBatchStatus("", "info");
  showToast("Resultados limpos!", "success");
}

// ------- PROCESSAR EMAIL (único) -------

async function processEmail() {
  const formData = new FormData();

  if (fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  } else if (emailText.value.trim() !== "") {
    formData.append("text", emailText.value);
  } else {
    showToast("Por favor, insira o texto ou selecione um arquivo.", "error");
    return;
  }

  clearResults();
  showStatus("Analisando email com IA...", "info");

  setLoadingState(true);

  try {
    const response = await fetch("/process", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    displayResult(data);
    saveToHistory(data);
    updateStatsFromResult(data.categoria);

    showStatus("Análise concluída com sucesso!", "success");
    showToast("Email analisado com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showStatus("Ocorreu um erro ao processar o email.", "error");
    showToast(err.message || "Erro ao processar o email.", "error");
  } finally {
    setLoadingState(false);
  }
}

// ------- PROCESSAR LOTE -------

async function processBatch() {
  if (!fileInput || fileInput.files.length === 0) {
    showToast("Selecione pelo menos um arquivo.", "error");
    return;
  }

  if (fileInput.files.length > 6) {
    showToast("Máximo de 6 arquivos permitidos.", "error");
    return;
  }

  const formData = new FormData();
  for (const file of fileInput.files) {
    formData.append("files", file);
  }

  if (batchTbody) batchTbody.innerHTML = "";
  if (batchResults) batchResults.style.display = "none";
  resultContainer.style.display = "none";

  showBatchStatus(`Processando ${fileInput.files.length} arquivo(s)...`, "info");
  setLoadingState(true);

  try {
    const response = await fetch("/process_batch", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.resultados || !Array.isArray(data.resultados)) {
      throw new Error("Resposta inesperada do servidor.");
    }

    data.resultados.forEach((item, index) => {
      if (!batchTbody) return;

      const tr = document.createElement("tr");
      tr.className = "batch-row";

      // Coluna Arquivo
      const tdNome = document.createElement("td");
      tdNome.className = "file-name-cell";
      const fileNameDiv = document.createElement("div");
      fileNameDiv.className = "file-name-content";
      fileNameDiv.textContent = item.filename || `Arquivo ${index + 1}`;
      tdNome.appendChild(fileNameDiv);

      // Coluna Categoria
      const tdCat = document.createElement("td");
      tdCat.className = "category-cell";
      const categoryBadge = document.createElement("span");
      const categoria = item.categoria || item.erro || "-";
      const isProductive = categoria.toLowerCase() === "produtivo";
      categoryBadge.className = `category-badge ${isProductive ? "productive" : "unproductive"}`;
      categoryBadge.textContent = item.erro ? `❌ ${item.erro}` : (isProductive ? "Produtivo" : " Improdutivo");
      tdCat.appendChild(categoryBadge);

      // Coluna Resposta
      const tdResp = document.createElement("td");
      tdResp.className = "reply-cell";
      const replyDiv = document.createElement("div");
      replyDiv.className = "reply-content-cell";
      if (item.erro) {
        replyDiv.textContent = item.erro;
        replyDiv.style.color = "var(--danger)";
      } else {
        replyDiv.textContent = item.resposta || "-";
      }
      tdResp.appendChild(replyDiv);

      // Coluna Ações
      const tdActions = document.createElement("td");
      tdActions.className = "actions-cell";
      if (!item.erro && item.resposta) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-row-btn";
        copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copiar';
        copyBtn.title = "Copiar resposta sugerida";
        copyBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(item.resposta);
            copyBtn.classList.add("copied");
            copyBtn.innerHTML = '<span class="copy-icon">✓</span> Copiado!';
            showToast("Resposta copiada!", "success");
            setTimeout(() => {
              copyBtn.classList.remove("copied");
              copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copiar';
            }, 2000);
          } catch (err) {
            showToast("Erro ao copiar. Tente novamente.", "error");
          }
        });
        tdActions.appendChild(copyBtn);
      } else {
        tdActions.textContent = "-";
      }

      tr.appendChild(tdNome);
      tr.appendChild(tdCat);
      tr.appendChild(tdResp);
      tr.appendChild(tdActions);

      batchTbody.appendChild(tr);

      // Atualiza estatísticas e histórico para cada item bem-sucedido
      if (item.categoria && !item.erro) {
        updateStatsFromResult(item.categoria);
      }
      if (item.resposta && !item.erro) {
        saveToHistory({
          categoria: item.categoria,
          resposta: item.resposta,
          texto_extraido: item.preview || "",
        });
      }
    });

    if (batchResults) batchResults.style.display = "block";
    showBatchStatus("Análise concluída com sucesso!", "success");
    showToast("Análise concluída com sucesso!", "success");
    batchResults.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    console.error(err);
    showBatchStatus("Erro ao processar os arquivos.", "error");
    showToast(err.message || "Erro ao processar os arquivos.", "error");
  } finally {
    setLoadingState(false);
  }
}

// ------- EXIBIR RESULTADO (único) -------

function displayResult(data) {
  const categoria = data.categoria ?? "-";
  const resposta = data.resposta ?? "-";
  const textoExtraido = data.texto_extraido || "";

  categorySpan.textContent = categoria;

  const isProductive = categoria.toLowerCase() === "produtivo";
  categoryCard.className = `category-card ${isProductive ? "productive" : "unproductive"
    }`;
  categoryIcon.textContent = isProductive ? "✅" : "💬";
  categoryDescription.textContent = isProductive
    ? "Este email requer ação ou resposta da sua parte."
    : "Este email não requer ação imediata.";

  replyP.textContent = resposta;

  if (textoExtraido) {
    previewContent.textContent = textoExtraido;
    textPreview.style.display = "block";
  } else {
    textPreview.style.display = "none";
  }

  resultContainer.style.display = "block";
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearResults() {
  categorySpan.textContent = "";
  replyP.textContent = "";
  resultContainer.style.display = "none";
}

// ------- ESTADO DE CARREGAMENTO -------

function setLoadingState(loading) {
  sendBtn.disabled = loading;
  const btnTextEl = sendBtn.querySelector(".btn-text");

  if (loading) {
    sendBtn.classList.add("loading");
    if (btnTextEl) btnTextEl.textContent = "Processando...";
  } else {
    sendBtn.classList.remove("loading");
    if (btnTextEl) btnTextEl.textContent = "Processar";
  }
}

// ------- STATUS -------

function showStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  if (!message) {
    statusEl.className = "status-message";
  }
}

function showBatchStatus(message, type = "info") {
  if (!batchStatus) return;
  batchStatus.textContent = message;
  batchStatus.className = `status-message ${type}`;

  if (!message) {
    batchStatus.className = "status-message";
  }
}

// ------- COPIAR RESPOSTA -------

async function copyReply() {
  const text = replyP.textContent;
  if (!text || text === "-") {
    showToast("Nenhuma resposta para copiar.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    showToast("Resposta copiada para a área de transferência!", "success");

    setTimeout(() => {
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    console.error("Erro ao copiar:", err);
    showToast("Erro ao copiar. Tente selecionar e copiar manualmente.", "error");
  }
}

// ------- HISTÓRICO -------

function saveToHistory(data) {
  const historyItem = {
    id: Date.now(),
    categoria: data.categoria,
    resposta: data.resposta,
    texto:
      data.texto_extraido ||
      emailText.value.substring(0, 200) ||
      "",
    timestamp: new Date().toISOString(),
  };

  history.unshift(historyItem);

  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  localStorage.setItem("emailHistory", JSON.stringify(history));
  updateHistory();
}

function updateHistory() {
  if (history.length === 0) {
    historySection.style.display = "none";
    return;
  }

  historySection.style.display = "block";
  historyList.innerHTML = "";

  history.slice(0, 10).forEach((item) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isProductive = item.categoria.toLowerCase() === "produtivo";

    historyItem.innerHTML = `
      <div class="history-item-header">
        <span class="history-category ${isProductive ? "productive" : "unproductive"
      }">
          ${isProductive ? "✅" : "💬"} ${item.categoria}
        </span>
      </div>
      <div class="history-text">${escapeHtml(item.texto)}</div>
      <div class="history-date">${dateStr}</div>
    `;

    historyItem.addEventListener("click", () => {
      emailText.value = item.texto;
      charCount.textContent = item.texto.length;
      switchTab("text");
      displayResult({
        categoria: item.categoria,
        resposta: item.resposta,
        texto_extraido: item.texto,
      });
      resultContainer.scrollIntoView({ behavior: "smooth" });
    });

    historyList.appendChild(historyItem);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ------- ESTATÍSTICAS -------

function updateStatsFromResult(categoria) {
  if (!categoria) return;

  stats.total++;
  if (categoria.toLowerCase() === "produtivo") {
    stats.productive++;
  } else {
    stats.unproductive++;
  }

  localStorage.setItem("emailStats", JSON.stringify(stats));
  updateStats();
}

function updateStats() {
  totalEmails.textContent = stats.total || 0;
  productiveEmails.textContent = stats.productive || 0;
  unproductiveEmails.textContent = stats.unproductive || 0;
}

// ------- ÚLTIMO RESULTADO (placeholder) -------

function loadLastResult() {
  // Você pode reaproveitar se quiser restaurar algo ao carregar
}

// ------- TOAST -------

function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
