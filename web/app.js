const sendBtn = document.getElementById("sendBtn");
const emailText = document.getElementById("emailText");
const fileInput = document.getElementById("fileInput");
const categorySpan = document.getElementById("category");
const replyP = document.getElementById("reply");

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

    const response = await fetch("http://127.0.0.1:8000/process", {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    categorySpan.textContent = data.categoria;
    replyP.textContent = data.resposta;
});
