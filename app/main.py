from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber

app = FastAPI()

# CORS (permite que o frontend acesse o backend localmente)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailText(BaseModel):
    text: str

@app.post("/process")
async def process_email(
    text: str = Form(None),
    file: UploadFile = File(None)
):
    # Extrai texto se for enviado arquivo .pdf ou .txt
    content = ""
    if file:
        if file.filename.endswith(".txt"):
            content = (await file.read()).decode("utf-8", errors="ignore")
        elif file.filename.endswith(".pdf"):
            with pdfplumber.open(file.file) as pdf:
                for page in pdf.pages:
                    content += page.extract_text() + "\n"
    elif text:
        content = text
    else:
        return {"error": "Nenhum texto ou arquivo enviado."}

    # Aqui futuramente faremos a classificação de fato.
    # Por enquanto, simulação simples:
    if "suporte" in content.lower() or "problema" in content.lower() or "atualização" in content.lower():
        category = "Produtivo"
        response = "Olá! Recebemos sua solicitação e retornaremos em breve com a atualização."
    else:
        category = "Improdutivo"
        response = "Olá! Agradecemos sua mensagem. Nenhuma ação é necessária."

    return {
        "categoria": category,
        "resposta": response,
        "texto_extraido": content[:300]  # Mostra só um pedaço para visualização
    }
