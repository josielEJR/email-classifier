import os
from typing import Optional

import joblib
import pdfplumber
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

# ---------------------------------------------------------
# Configuração e carregamento de dependências
# ---------------------------------------------------------

# Caminho absoluto do modelo (model.pkl) dentro da pasta app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(
        f"Arquivo de modelo não encontrado em: {MODEL_PATH}. "
        "Certifique-se de rodar o script de treino (app/train_model.py) antes de iniciar o servidor."
    )

# Carrega o modelo de classificação (TF-IDF + LogisticRegression)
model = joblib.load(MODEL_PATH)

# Garante que a API key da OpenAI está definida
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY não definida. "
        "Defina a variável de ambiente com sua chave da OpenAI antes de iniciar o servidor."
    )

# Inicializa o cliente da OpenAI
client = OpenAI(api_key=api_key)

# ---------------------------------------------------------
# Configuração da aplicação FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="Classificador de Emails - AutoU",
    description="API para classificar emails em Produtivo/Improdutivo e sugerir respostas automáticas.",
    version="1.0.0",
)

# Libera o acesso do frontend (localhost, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # em produção: colocar domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Funções auxiliares
# ---------------------------------------------------------

def extrair_texto_arquivo(file: UploadFile) -> str:
    """
    Lê o conteúdo de um UploadFile (.txt ou .pdf) e retorna o texto.
    """
    filename = file.filename or ""

    if filename.lower().endswith(".txt"):
        # Leitura de arquivo texto
        raw = file.file.read()
        # Se for async, poderíamos usar await file.read(), mas aqui usamos .file direto
        try:
            return raw.decode("utf-8", errors="ignore")
        except AttributeError:
            # Caso raw já seja string
            return str(raw)

    elif filename.lower().endswith(".pdf"):
        # Leitura de PDF com pdfplumber
        texto = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                texto += page_text + "\n"
        return texto

    else:
        raise HTTPException(
            status_code=400,
            detail="Formato de arquivo não suportado. Envie .txt ou .pdf.",
        )


def gerar_resposta_gpt(categoria: str, conteudo: str) -> str:
    """
    Usa GPT para gerar uma resposta automática em PT-BR,
    personalizada com base na categoria (Produtivo/Improdutivo)
    e no texto do email.
    """
    system_prompt = (
        "Você é um assistente de atendimento ao cliente de uma grande empresa "
        "do setor financeiro. Responda sempre em português do Brasil, com tom "
        "profissional, educado e objetivo."
    )

    user_prompt = f"""
Categoria do email: {categoria}

Texto do email recebido:
\"\"\"{conteudo}\"\"\"

Tarefa:
1. Se o email for PRODUTIVO:
   - Responda de forma clara, peça informações adicionais se necessário
   - Explique próximos passos de forma objetiva
   - Evite mensagens muito longas (3 a 6 frases)

2. Se o email for IMPRODUTIVO:
   - Agradeça a mensagem de forma cordial
   - Deixe claro que não é necessária nenhuma ação adicional
   - Mantenha a resposta curta (2 a 4 frases)

Escreva apenas o texto da resposta que será enviada ao cliente.
Nada de explicações adicionais, apenas a resposta pronta.
"""

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # modelo leve, bom para esse tipo de tarefa
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=300,
        )
        resposta = completion.choices[0].message.content.strip()
        return resposta

    except Exception as e:
        # Log simples no servidor
        print(f"[ERRO OPENAI] {e}")

        # Fallback simples se a API falhar
        if categoria == "Produtivo":
            return (
                "Olá! Recebemos sua mensagem e estamos analisando sua solicitação. "
                "Caso necessário, entraremos em contato solicitando informações adicionais."
            )
        else:
            return (
                "Olá! Agradecemos sua mensagem e o contato. "
                "No momento não é necessária nenhuma ação adicional."
            )


# ---------------------------------------------------------
# Rotas da API
# ---------------------------------------------------------

@app.get("/")
def health_check():
    """
    Health check simples para verificar se a API está no ar.
    """
    return {"status": "ok", "message": "API de classificação de emails em execução."}


@app.post("/process")
async def process_email(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Recebe ou texto direto (campo 'text') ou um arquivo (.txt/.pdf),
    classifica o email e gera uma resposta automática.
    """
    # 1) Obtém o conteúdo do email
    if file is not None:
        conteudo = extrair_texto_arquivo(file)
    elif text:
        conteudo = text
    else:
        raise HTTPException(
            status_code=400,
            detail="Nenhum texto ou arquivo enviado. Envie o campo 'text' ou um arquivo .txt/.pdf.",
        )

    conteudo_limpo = conteudo.strip()
    if not conteudo_limpo:
        raise HTTPException(
            status_code=400,
            detail="O conteúdo do email está vazio após a leitura.",
        )

    # 2) Classificação com o modelo de ML
    categoria = model.predict([conteudo_limpo])[0]

    # 3) Geração de resposta com GPT
    resposta = gerar_resposta_gpt(categoria, conteudo_limpo)

    # 4) Retorno para o frontend
    return {
        "categoria": categoria,
        "resposta": resposta,
        # Enviar só um trecho do texto para debug/visualização (opcional)
        "texto_extraido": conteudo_limpo[:500],
    }
