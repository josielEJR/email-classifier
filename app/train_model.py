import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

nltk.download('stopwords')
from nltk.corpus import stopwords

# -----------------------------------------
# Dataset de treino
# -----------------------------------------

emails_produtivos = [
    "Preciso de ajuda com o acesso ao sistema",
    "Como faço para atualizar meus dados no portal?",
    "O relatório de vendas não está carregando",
    "Qual é o status da minha solicitação de suporte?",
    "Poderiam enviar o comprovante da transação?",
    "Estou enfrentando erro ao tentar entrar no sistema",
    "Favor verificar o chamado número 12345",
    "Gostaria de abrir um chamado para suporte",
    "Poderiam analisar o problema de login?",
    "Solicito atualização sobre o andamento do meu pedido",
    "Poderiam verificar o motivo da falha na transação?",
    "Preciso de orientação para concluir o cadastro",
    "Solicito retorno sobre o problema relatado ontem",
]

emails_improdutivos = [
    "Feliz natal e boas festas para todos!",
    "Agradeço o excelente atendimento de sempre",
    "Bom dia, desejo uma ótima semana",
    "Parabéns pelo ótimo trabalho!",
    "Obrigado, tudo resolvido!",
    "Tenham um ótimo fim de semana",
    "Agradeço pela atenção dispensada",
    "Obrigado pela ajuda!",
    "Ótimo trabalho!",
    "Agradeço o suporte prestado",
    "Feliz ano novo a todos!",
    "Obrigado pela rápida resposta",
    "Bom dia, espero que estejam todos bem",
    "Agradeço muito pelo suporte prestado anteriormente",
    "Desejo um excelente dia a toda a equipe",
    "Obrigado pela colaboração de sempre",
    "Parabéns pelo atendimento prestado!",
    "Agradeço o empenho da equipe",
    "Tenham todos uma ótima semana",
    "Fico grato pela atenção",
    "Muito obrigado pela ajuda prestada",
    "Envio apenas para agradecer o suporte",
    "Desejo um ótimo feriado a todos",
    "Agradeço pela resposta rápida",
    "Bom dia, obrigado.",
]

X = emails_produtivos + emails_improdutivos
y = ["Produtivo"] * len(emails_produtivos) + ["Improdutivo"] * len(emails_improdutivos)

# -----------------------------------------
# Modelo com TF-IDF + n-grams (1 e 2 palavras)
# -----------------------------------------

stop_words_pt = stopwords.words('portuguese')

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words=stop_words_pt,
        ngram_range=(1, 2)  # pega combinações tipo "obrigado pela", "feliz natal"
    )),
    ("clf", LogisticRegression(max_iter=1000))
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
pipeline.fit(X_train, y_train)

pred = pipeline.predict(X_test)
print(classification_report(y_test, pred))

joblib.dump(pipeline, "app/model.pkl")
print("✅ Modelo treinado e salvo em app/model.pkl")
