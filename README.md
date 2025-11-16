# Classificador de Emails com IA  
Produtivo x Improdutivo + Resposta Automática + Lote (até 6 arquivos)

Este projeto é uma aplicação web que:

1. **Lê emails** (texto colado, `.txt` ou `.pdf` ou arquivos dropados);
2. **Classifica** cada email em:
   - `Produtivo` (quando exige ação/resposta)
   - `Improdutivo` (mensagens de cortesia, agradecimentos etc.)
3. **Gera uma resposta automática** em português usando **OpenAI GPT**;
4. **Processa vários emails em lote** (até **6 arquivos** de uma vez) e exibe:
   - Categoria por arquivo
   - Resumo da resposta sugerida
   - Botão **“Copiar resposta”** por linha.

Projeto desenvolvido como solução para um **desafio de processo seletivo** na área de IA / automação de atendimento.

---

## Tecnologias utilizadas

- **Backend**
  - Python 3
  - FastAPI + Uvicorn
  - scikit-learn (TF-IDF + Logistic Regression)
  - NLTK (stopwords em português)
  - pdfplumber (extração de texto de PDF)
  - OpenAI (modelo GPT para gerar respostas)
  - python-dotenv (carregar variáveis de ambiente, ex.: `OPENAI_API_KEY`)

- **Frontend**
  - HTML, CSS, JavaScript puro
  - UI com:
    - Abas: **Texto** / **Arquivo(s)**
    - Drag & drop para upload
    - Cards de resultado
    - Tabela de resultados em lote com botão **Copiar** por linha
    - Histórico local (localStorage)
    - Estatísticas rápidas (total, produtivos, improdutivos)
    - Toasts / feedback visual

---

## Estrutura do projeto

```bash
email-classifier/
├── app/
│   ├── main.py          # API FastAPI (classificação + GPT + batch)
│   └── train_model.py   # Script para treinar e salvar o modelo (model.pkl)
├── web/
│   ├── index.html       # Interface web (tabs Texto/Arquivo + lote)
│   ├── styles.css       # Estilos
│   └── app.js           # Lógica JS (único vs. lote, tabela, histórico, etc.)
├── requirements.txt     # Dependências Python
└── README.md            # Este arquivo
```

---

## Pré-requisitos

- Python 3.9+
- `pip` (gerenciador de pacotes)
- (Opcional, mas recomendado) `venv` / `virtualenv`

Verificação rápida no Linux/Ubuntu:

```bash
python3 --version
pip --version
```

---

## 1. Clonar o repositório

```bash
git clone https://github.com/josielEJR/email-classifier.git
cd email-classifier
```
---

## 2. Criar e ativar o ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate        # Linux / macOS

# No Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
```

Quando o ambiente estiver ativo, o terminal geralmente mostra `(venv)` no início da linha.

---

## 3. Instalar dependências

```bash
pip install -r requirements.txt
```

---

## 4. Treinar o modelo de classificação

O modelo (TF-IDF + Logistic Regression) é treinado em um conjunto simples de exemplos para diferenciar **emails produtivos** x **improdutivos**.

```bash
python3 app/train_model.py
```

Se tudo der certo, será gerado o arquivo:

```bash
app/model.pkl
```

> Importante: se esse arquivo **não existir**, o backend não sobe.  
> Sempre rode o `train_model.py` pelo menos uma vez antes de iniciar a API.

---

## 5. Configurar a chave da OpenAI (`OPENAI_API_KEY`)

A aplicação lê a chave via variável de ambiente (pode estar num `.env`).

### Opção A – Exportar direto no terminal

```bash
export OPENAI_API_KEY="SUA_CHAVE_AQUI"
```

Conferir:

```bash
echo $OPENAI_API_KEY
```

### Opção B – Arquivo `.env`

Crie um arquivo `.env` na raiz (`email-classifier/.env`):

```env
OPENAI_API_KEY=SUA_CHAVE_AQUI
```

O `main.py` usa `python-dotenv` para carregar essa variável.

---

## 6. Subir o backend (API FastAPI)

Na raiz do projeto, com o venv ativo:

```bash
uvicorn app.main:app --reload
```

Saída esperada:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Endpoints principais

- `GET /`  
  → Serve a interface web (`index.html`).

- `POST /process`  
  → Recebe **texto ou 1 arquivo** (`text` ou `file`) e retorna:
  ```json
  {
    "categoria": "Produtivo" | "Improdutivo",
    "resposta": "texto sugerido pelo GPT ou fallback",
    "texto_extraido": "trecho do email"
  }
  ```

- `POST /process_batch`  
  → Recebe **vários arquivos** (`files`) e retorna:
  ```json
  {
    "resultados": [
      {
        "filename": "email_1.txt",
        "categoria": "Produtivo",
        "resposta": "resposta sugerida",
        "preview": "trecho do texto analisado"
      },
      ...
    ]
  }
  ```

Se a chamada à OpenAI falhar, o backend devolve uma **resposta padrão** (fallback), diferente para Produtivo e Improdutivo, para nunca ficar “sem resposta”.

---

## 7. Subir o frontend (interface web)

Em outro terminal / aba:

```bash
cd web
python3 -m http.server 5500
```

Saída esperada:

```text
Serving HTTP on 0.0.0.0 port 5500 ...
```

Acesse:

- Aplicação: `http://127.0.0.1:8000/`

> O FastAPI já está preparado para servir o `index.html` na raiz (`/`).

---

## 8. Testando a aplicação

### Modo 1 – Texto (aba **Texto**)

Exemplo de email **produtivo**:

> Bom dia, estou com problema para acessar o sistema e preciso de uma atualização sobre a minha solicitação de suporte.

1. Vá na aba **Texto**  
2. Cole o texto  
3. Clique em **Processar**

Resultado esperado:

- Categoria: **Produtivo**
- Card amarelo com mensagem de que requer ação
- Resposta sugerida (GPT ou fallback)
- Texto analisado disponível em “Texto analisado”.

---

### Modo 2 – Arquivo único (aba **Arquivo(s)**)

1. Vá na aba **Arquivo(s)**
2. Arraste um `.txt` ou `.pdf` ou clique para selecionar
3. Clique em **Processar**

A lógica é a mesma do modo Texto, mas o backend primeiro extrai o conteúdo do arquivo.

---

### Modo 3 – Múltiplos arquivos / lote (aba **Arquivo(s)**)

1. Ainda na aba **Arquivo(s)**, selecione **até 6 arquivos** `.txt` ou `.pdf`  
   - via drag & drop  
   - ou segurando `Ctrl`/`Shift` ao selecionar
2. O contador mostra algo como: `6 arquivos selecionados`
3. Clique em **Processar**

A aplicação:

- Chama o endpoint `/process_batch`
- Preenche a seção **“Resultados dos Arquivos”** com uma tabela contendo:
  - `#` (índice)
  - `Arquivo`
  - `Categoria`
  - `Resposta sugerida (resumo)`
  - Botão **“Copiar resposta”** por linha

Cada item do lote também atualiza:

- Estatísticas (total, produtivos, improdutivos)
- Histórico local (com limite de itens)

---

## 9. Testando a API diretamente (Postman / cURL)

### a) Texto direto

```bash
curl -X POST http://127.0.0.1:8000/process \
  -F "text=Estou com dificuldade para acessar o portal, poderiam verificar?"
```

### b) 1 arquivo `.txt` ou `.pdf`

```bash
curl -X POST http://127.0.0.1:8000/process \
  -F "file=@email_exemplo.txt"
```

### c) Múltiplos arquivos (lote)

```bash
curl -X POST http://127.0.0.1:8000/process_batch \
  -F "files=@email1.txt" \
  -F "files=@email2.txt" \
  -F "files=@email3.txt"
```

---

## 10. Possíveis erros comuns (Troubleshooting)

**1) `RuntimeError: OPENAI_API_KEY não definida`**

- Causa: variável de ambiente não foi configurada.
- Solução:
  ```bash
  export OPENAI_API_KEY="SUA_CHAVE_AQUI"
  uvicorn app.main:app --reload
  ```

---

**2) `Arquivo de modelo não encontrado em: ... model.pkl`**

- Causa: `train_model.py` ainda não foi rodado.
- Solução:
  ```bash
  python3 app/train_model.py
  ```

---

**3) Frontend abre mas não aparece resposta**

- Verifique se o backend está ativo em `http://127.0.0.1:8000`.
- Veja no terminal se está chegando requisição:
  ```text
  INFO: 127.0.0.1:XXXXX - "POST /process HTTP/1.1" 200 OK
  ```
- Se aparecer erro 500, normalmente é:
  - API Key da OpenAI incorreta
  - `model.pkl` ausente ou corrompido

---

## 11. Resumo rápido (para avaliadores)

Para rodar localmente:

```bash
git clone https://github.com/SEU_USUARIO/email-classifier.git
cd email-classifier

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python3 app/train_model.py

# Definir OPENAI_API_KEY (via .env ou export)
uvicorn app.main:app --reload
```

Acessar:

- Aplicação: `http://127.0.0.1:8000/`

Funcionalidades-chave:

- Classificação **Produtivo x Improdutivo**
- Resposta automática via **GPT** com **fallback** em caso de erro
- Upload de **texto, 1 arquivo ou múltiplos arquivos (até 6)**
- Tabela de resultados em lote com **botão de copiar resposta** por item
- Histórico e estatísticas de uso no próprio frontend.
