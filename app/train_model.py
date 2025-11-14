import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Baixar recursos do nltk
nltk.download('stopwords')
nltk.download('punkt')
from nltk.corpus import stopwords

# -----------------------
# Dataset sintético inicial
# -----------------------
emails_produtivos = [
    "Preciso de ajuda com o acesso ao sistema",
    "Como faço para atualizar meus dados no portal?",
    "O relatório de vendas não está carregando",
    "Qual é o status da minha solicitação de suporte?",
    "Poderiam enviar o comprovante da transação?",
    "Estou enfrentando erro ao tentar entrar no sistema",
    "Favor verificar o chamado número 12345",
]

emails_improdutivos = [
    "Feliz natal e boas festas para todos!",
    "Agradeço o excelente atendimento de sempre",
    "Bom dia, desejo uma ótima semana",
    "Parabéns pelo ótimo trabalho!",
    "Obrigado, tudo resolvido!",
    "Tenham um ótimo fim de semana",
]

X = emails_produtivos + emails_improdutivos
y = ["Produtivo"] * len(emails_produtivos) + ["Improdutivo"] * len(emails_improdutivos)

# -----------------------
# Pré-processamento + modelo
# -----------------------
stop_words_pt = stopwords.words('portuguese')

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words=stop_words_pt)),
    ("clf", LogisticRegression())
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
pipeline.fit(X_train, y_train)

# -----------------------
# Avaliação rápida
# -----------------------
pred = pipeline.predict(X_test)
print(classification_report(y_test, pred))

# -----------------------
# Salvar modelo treinado
# -----------------------
joblib.dump(pipeline, "app/model.pkl")
print("✅ Modelo treinado e salvo em app/model.pkl")
