const sendBtn = document.getElementById("sendBtn");
const emailText = document.getElementById("emailText");
const fileInput = document.getElementById("fileInput");
const categorySpan = document.getElementById("category");
const replyP = document.getElementById("reply");
const statusEl = document.getElementById("status");

sendBtn.addEventListener("click", async () => {
    const formData = new FormData();

    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    } else if (emailText.value.trim() !== "") {
        formData.append("text", emailText.value);
    } else {
        alert("Por favor, insira o texto ou selecione um arquivo.");
        return;
    }

    // Limpa resultados anteriores
    categorySpan.textContent = "";
    replyP.textContent = "";
    if (statusEl) statusEl.textContent = "Analisando email, aguarde...";

    // Ativa estado de carregamento
    sendBtn.disabled = true;
    sendBtn.classList.add("loading");
    const btnTextEl = sendBtn.querySelector(".btn-text");
    if (btnTextEl) btnTextEl.textContent = "Processando...";

    try {
        const response = await fetch("/process", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        categorySpan.textContent = data.categoria ?? "-";
        replyP.textContent = data.resposta ?? "-";
        if (statusEl) statusEl.textContent = "Análise concluída ✅";
    } catch (err) {
        console.error(err);
        if (statusEl) statusEl.textContent = "Ocorreu um erro ao processar o email.";
        alert("Erro ao processar o email. Verifique o console para mais detalhes.");
    } finally {
        // Desliga o estado de carregamento
        sendBtn.disabled = false;
        sendBtn.classList.remove("loading");
        if (btnTextEl) btnTextEl.textContent = "Processar";
    }
});
