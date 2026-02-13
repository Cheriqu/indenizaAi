import os
import sqlite3
import pandas as pd
import numpy as np
import mercadopago
import json
import traceback
import uuid
import smtplib
import google.generativeai as genai
import chromadb
import logging
from logging.handlers import RotatingFileHandler
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from io import BytesIO
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, CrossEncoder
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import quote
import re
import requests
import base64

# --- REPORTLAB (GERADOR DE PDF) ---
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ImageRL
from reportlab.lib.utils import ImageReader
from cachetools import TTLCache

# --- CONFIGURAÇÃO DE LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        RotatingFileHandler("backend.log", maxBytes=5*1024*1024, backupCount=3, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://indenizaapp.com.br",
        "https://www.indenizaapp.com.br",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÕES DE DIRETÓRIOS INTELIGENTES ---
CURRENT_DIR = Path(__file__).resolve().parent
DB_DIR = CURRENT_DIR
CHROMA_DB_DIR = DB_DIR / "chroma_db"
ASSETS_DIR = CURRENT_DIR.parent / "public" / "assets"
DB_PATH = DB_DIR / "indeniza.db"

MP_TOKEN = os.getenv("MP_TOKEN")
OPENAI_KEY = os.getenv("OPENROUTER_API_KEY")
SENHA_ADMIN = os.getenv("SENHA_ADMIN")
if not SENHA_ADMIN:
    logger.warning("⚠️ AVISO: SENHA_ADMIN não definida no .env. Admin bloqueado.")
    SENHA_ADMIN = None



# --- FUNÇÃO ENVIAR EMAIL (VIA API BREVO) ---
def enviar_email_pdf(destinatario, nome, pdf_buffer):
    # Pega a chave API do .env (onde você colocou a chave xkeysib...)
    API_KEY = os.getenv("BREVO_API_KEY") 
    
    if not API_KEY or not API_KEY.startswith("xkeysib"):
        logger.error("❌ Erro: Chave API da Brevo não encontrada ou inválida no .env")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    
    # Prepara o PDF para envio (Converte para Base64)
    try:
        pdf_base64 = base64.b64encode(pdf_buffer.getvalue()).decode('utf-8')
    except Exception as e:
        logger.error(f"❌ Erro ao processar PDF para email: {e}")
        return

    # Garante que o nome não seja None
    nome_tratado = nome if nome else "Cliente"

    # Monta o pacote igual ao Postman
    payload = {
        "sender": {
            "name": "Equipe Indeniza Aí",
            "email": "contato@indenizaapp.com.br"
        },
        "to": [
            {
                "email": destinatario,
                "name": nome_tratado
            }
        ],
        "subject": "Seu Relatório Indeniza Aí Chegou! ⚖️",
        "htmlContent": f"""<!DOCTYPE html>
        <html>
            <body>
                <p>Olá, <strong>{nome_tratado}</strong>!</p>
                <p>Seu relatório completo de análise jurimétrica está anexo a este e-mail.</p>
                <br>
                <p>Atenciosamente,</p>
                <p><strong>Equipe Indeniza Aí</strong></p>
            </body>
        </html>""",
        "textContent": f"Olá, {nome_tratado}!\n\nSeu relatório completo de análise jurimétrica está anexo.\n\nAtenciosamente,\nEquipe Indeniza Aí",
        "attachment": [
            {
                "content": pdf_base64,
                "name": f"Relatorio_IndenizaAi.pdf"
            }
        ]
    }
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"✅ Email enviado via API para {destinatario}")
        else:
            logger.error(f"❌ Erro API Brevo: {response.text}")
            
    except Exception as e:
        logger.error(f"❌ Erro Request: {e}")

# --- COFRE TEMPORÁRIO (CACHE) ---
# TTL: 24 horas, Max: 1000 itens
ANALISES_CACHE = TTLCache(maxsize=1000, ttl=86400)

# --- MODELOS ---
class AnaliseRequest(BaseModel):
    relato: str = Field(..., max_length=5000)

class LeadData(BaseModel):
    nome: str
    email: str
    whatsapp: str
    cidade: str
    resumo: str
    categoria: str
    prob: float
    valor: float
    aceita_advogado: bool
    id_analise: str

    class Config:
        extra = "ignore"

class AdminAuth(BaseModel):
    senha: str

class AdminActionRequest(BaseModel):
    senha: str
    id_analise: str

# --- CARREGAMENTO DE IA ---
model_bi = None
model_cross = None
chroma_client = None

@app.on_event("startup")
def load_models():
    global model_bi, model_cross, chroma_client

    logger.info(f"📂 Diretório Base: {CURRENT_DIR}")
    logger.info(f"📂 Diretório Assets (Logo): {ASSETS_DIR}")

    logger.info("Carregando modelos de IA e ChromaDB...")
    try:
        # Carrega ChromaDB
        chroma_client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
        logger.info(f"✅ ChromaDB carregado de {CHROMA_DB_DIR}")

        # Carrega Modelos NLP
        model_bi = SentenceTransformer("intfloat/multilingual-e5-large")
        model_cross = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
        logger.info("✅ Modelos de IA carregados.")
    except Exception as e: 
        logger.error(f"Erro IA/DB: {e}")
        # Adicionando mais detalhes para debug
        logger.error(f"Detalhes do erro: {traceback.format_exc()}")

# --- INIT DB ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT, data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        nome TEXT, email TEXT, whatsapp TEXT, cidade TEXT, resumo_caso TEXT, categoria TEXT, 
        probabilidade REAL, valor_estimado REAL, pagou BOOLEAN DEFAULT 0, id_analise TEXT,
        json_analise TEXT
    )''')
    try:
        c.execute("ALTER TABLE leads ADD COLUMN json_analise TEXT")
    except: pass
    conn.commit()
    conn.close()

init_db()

# --- HELPERS ---
def formatar_moeda(valor):
    try:
        if valor is None: return "R$ 0,00"
        return f"R$ {float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except: return "R$ 0,00"

def get_analise_data(id_analise):
    if id_analise in ANALISES_CACHE: return ANALISES_CACHE[id_analise]
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT json_analise, pagou FROM leads WHERE id_analise = ?", (id_analise,))
    row = c.fetchone()
    conn.close()
    
    if row and row[0]:
        try:
            dados = json.loads(row[0])
            if row[1]: dados["pago"] = True
            ANALISES_CACHE[id_analise] = dados
            return dados
        except Exception as e:
            logger.error(f"Erro deserializar: {e}")
    return None

# --- FUNÇÃO GERADORA DE PDF (APRIMORADA) ---
def criar_pdf_bytes(dados_analise, nome_cliente):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # Estilos
    styleTitle = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor("#1c80b2"), alignment=1, spaceAfter=20)
    styleSub = ParagraphStyle('Sub', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor("#0f172a"), spaceAfter=10)
    styleBody = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=8)
    styleLink = ParagraphStyle('Link', parent=styles['Normal'], fontSize=8, textColor=colors.blue, underline=True)
    styleResultGreen = ParagraphStyle('Green', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor("#22c55e"), fontName="Helvetica-Bold")
    styleResultGray = ParagraphStyle('Gray', parent=styles['Normal'], fontSize=10, textColor=colors.gray, fontName="Helvetica-Bold")

    # Logo
    logo_path = ASSETS_DIR / "logo.png"
    if not logo_path.exists():
        logo_path = Path("/var/www/indeniza/dist/assets/logo.png")
    
    if logo_path.exists():
        try:
            img_reader = ImageReader(str(logo_path))
            iw, ih = img_reader.getSize()
            aspect = ih / float(iw)
            display_width = 250
            display_height = display_width * aspect
            im = ImageRL(str(logo_path), width=display_width, height=display_height)
            im.hAlign = 'CENTER'
            elements.append(im)
            elements.append(Spacer(1, 20))
        except: elements.append(Paragraph("INDENIZA AÍ", styleTitle))
    else:
        elements.append(Paragraph("INDENIZA AÍ", styleTitle))

    elements.append(Paragraph("RELATÓRIO DE ANÁLISE JURIMÉTRICA", styleTitle))
    elements.append(Paragraph(f"Interessado: {nome_cliente}", styleSub))
    elements.append(Spacer(1, 10))

    valor_fmt = formatar_moeda(dados_analise['valor_estimado'])
    dados_tabela = [
        ["Categoria Identificada", dados_analise["categoria"]],
        ["Probabilidade de Êxito", f"{dados_analise['probabilidade']:.0f}%"],
        ["Estimativa de Indenização", valor_fmt]
    ]
    t = Table(dados_tabela, colWidths=[200, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#eaf2f6")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    if "relato" in dados_analise:
        elements.append(Paragraph("Seu Relato", styleSub))
        elements.append(Paragraph(f"<i>\"{dados_analise['relato']}\"</i>", styleBody))
        elements.append(Spacer(1, 20))

    elements.append(Paragraph("Jurisprudência Selecionada (TJPR)", styleSub))
    elements.append(Paragraph("Abaixo listamos decisões reais similares:", styleBody))
    elements.append(Spacer(1, 10))

    for caso in dados_analise["casos"]:
        elements.append(Paragraph(f"<b>Data Julgamento: {caso['data']}</b>", styleBody))
        texto_resumo = str(caso['resumo']).replace("<", "&lt;").replace(">", "&gt;")
        elements.append(Paragraph(texto_resumo, styleBody))
        
        tipo = caso.get("tipo_resultado", "DERROTA")
        valor_raw = float(caso.get('valor', 0))
        
        if tipo == "VITORIA":
            txt_val = f"Valor da Condenação: {formatar_moeda(valor_raw)}" if valor_raw > 0 else "Valor da Condenação: Não Informado"
            elements.append(Paragraph(txt_val, styleResultGreen))
        else:
             elements.append(Paragraph("Valor da Condenação: Indenização Negada", styleResultGray))

        link = caso['link']
        if link and link != '#' and link.startswith('http'):
            try:
                link_clean = quote(link.strip(), safe='/:?=&%')
                link_html = f'<a href="{link_clean}">CLIQUE AQUI PARA VER O PROCESSO COMPLETO</a>'
                elements.append(Paragraph(link_html, styleLink))
            except: pass
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("_" * 60, styleBody))
        elements.append(Spacer(1, 15))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<font size=8 color=grey>Este documento foi gerado automaticamente por IA. Não substitui consulta jurídica.</font>", styleBody))
    
    elements.append(Paragraph("<b>Indeniza Aí © 2026</b>", ParagraphStyle('Footer', parent=styles['BodyText'], alignment=1, fontSize=8)))

    doc.build(elements)
    buffer.seek(0)
    return buffer



# --- ENDPOINTS ---

@app.post("/api/analisar")
def analisar_caso(request: AnaliseRequest):
    GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=GOOGLE_KEY)
    
    prompt_text = f"""
    Analise o seguinte relato e classifique-o na MELHOR categoria jurídica abaixo:
    
    1. AEREO (Cancelamento/Atraso de voo, Bagagem extraviada)
    2. FRAUDE_PIX (Golpes, Fraude Pix, Transação não reconhecida)
    3. BLOQUEIO_BANCARIO (Conta bloqueada, encerrada, retenção de valores)
    4. CORTE_ESSENCIAL (Corte indevido de Luz/Água/Gás, TOI)
    5. NOME_SUJO (Negativação indevida, SPC/Serasa, Manutenção indevida)
    6. TELEFONIA (Cobrança indevida, serviço não contratado, plano alterado)
    7. PLANO_SAUDE (Negativa de cirurgia/home care/medicamento, Reajuste abusivo)
    8. IMOBILIARIO (Atraso na entrega de imóvel, vícios construtivos)
    9. SEGURADORA (Negativa de cobertura de seguro auto/residencial/vida)
    10. REDES_SOCIAIS (Instagram/Facebook hackeado, Golpe no WhatsApp)
    11. ECOMMERCE (Produto não entregue, atraso na entrega, produto com defeito)
    12. ENSINO (Problemas com faculdade/curso, diploma, cobrança indevida)
    13. OUTROS (Caso não se encaixe em nenhum acima)

    Verifique se é um relato jurídico válido (textos sem sentido ou muito curtos devem ser invalidados).
    Responda APENAS um JSON válido no formato: {{"categoria": "...", "valido": true/false}}.
    
    Relato: {request.relato[:1000]}
    """

    resp = None
    last_error = None

    # TENTATIVA 1: Gemini (com nova biblioteca)
    gemini_models = ["gemini-2.5-flash-lite", "gemini-2.0-flash"] # Modelos para tentar funcionar
    for model_name in gemini_models:
        try:
            logger.info(f"🔄 Tentando Gemini: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt_text, generation_config={"response_mime_type": "application/json"})
            resp = json.loads(response.text)
            if resp: break
        except Exception as e:
            logger.error(f"❌ Falha Gemini {model_name}: {e}")
            last_error = e
            continue

    # TENTATIVA 2: OpenRouter
    if not resp:
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENAI_KEY)
        openrouter_models = ["google/gemini-pro-1.5", "meta-llama/llama-3.3-70b-instruct:free"]
        for model in openrouter_models:
            try:
                logger.info(f"🔄 Tentando OpenRouter: {model}...")
                check = client.chat.completions.create(
                    model=model, 
                    messages=[{"role": "user", "content": prompt_text + " Responda apenas JSON."}], 
                    temperature=0.1
                )
                match = re.search(r'\{.*\}', check.choices[0].message.content, re.DOTALL)
                if match: 
                    resp = json.loads(match.group(0))
                    break
            except Exception as e:
                logger.error(f"❌ Falha OpenRouter {model}: {e}")
                continue

    if not resp:
        raise HTTPException(status_code=503, detail="IA indisponível no momento.")

    if not resp.get("valido"):
        raise HTTPException(status_code=400, detail="Relato Inválido ou Curto Demais")
    
    categoria = resp.get("categoria", "OUTROS")
    
    # --- BUSCA NO CHROMADB ---
    if categoria == "OUTROS":
        return {"erro": "Não tratamos deste caso no momento."}

    try:
        collection = chroma_client.get_collection(name=categoria)
    except:
        # Tenta fallback para LUZ se for CORTE_ESSENCIAL e falhar
        if categoria == "CORTE_ESSENCIAL":
            try: collection = chroma_client.get_collection(name="LUZ")
            except: return {"erro": "Base de dados temporariamente indisponível."}
        else:
            return {"erro": "Base de dados temporariamente indisponível."}

    # Embed e Busca
    vetor_query = model_bi.encode([f"query: {request.relato}"]).tolist()
    results = collection.query(query_embeddings=vetor_query, n_results=20)

    # Reranking com CrossEncoder
    candidatos = []
    for i in range(len(results['ids'][0])):
        doc_text = results['documents'][0][i]
        meta = results['metadatas'][0][i]
        candidatos.append({
            "texto": doc_text,
            "meta": meta,
            "par": [request.relato, doc_text.replace("passage:", "").strip()]
        })

    scores = model_cross.predict([c['par'] for c in candidatos])
    
    # Ordena e Classifica
    finais = []
    vitorias = 0
    soma_valor = 0

    for idx, score in sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:20]:
        item = candidatos[idx]
        meta = item['meta']
        
        # Lógica de Classificação
        res_txt = str(meta.get("resultado", "")).lower()
        val = float(meta.get("valor_total", 0))
        
        tipo = "DERROTA"
        if "parcial" in res_txt or "procedente" in res_txt or val > 0:
            if not ("improcedente" in res_txt and val == 0):
                tipo = "VITORIA"
        
        if tipo == "VITORIA":
            vitorias += 1
            soma_valor += val
            
        finais.append({
            "resumo": meta.get("resumo", ""),
            "valor": val,
            "data": meta.get("data_julgamento", ""),
            "link": meta.get("link", "#"),
            "tipo_resultado": tipo
        })

    prob = min((vitorias / 20) * 100, 95.0)
    val_medio = soma_valor / vitorias if vitorias > 0 else 0

    # Prepara Resposta
    casos_censurados = []
    casos_reais = finais[:3]
    
    for caso in casos_reais:
        casos_censurados.append({
            "resumo": "🔒 Conteúdo bloqueado...", 
            "valor": caso['valor'], 
            "data": caso['data'], 
            "link": "#",
            "tipo_resultado": caso['tipo_resultado']
        })

    id_analise = str(uuid.uuid4())
    
    # Salva Cache
    ANALISES_CACHE[id_analise] = {
        "probabilidade": prob, 
        "valor_estimado": val_medio, 
        "categoria": categoria, 
        "n_casos": 20, 
        "casos": casos_reais, 
        "pago": False,
        "relato": request.relato
    }

    # Salva Lead
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO leads (resumo_caso, categoria, probabilidade, valor_estimado, id_analise, json_analise) VALUES (?,?,?,?,?,?)",
            (request.relato, categoria, prob, val_medio, id_analise, json.dumps(ANALISES_CACHE[id_analise], ensure_ascii=False)))
    conn.commit()
    conn.close()

    return {"id_analise": id_analise, "probabilidade": prob, "valor_estimado": val_medio, "categoria": categoria, "n_casos": 20, "casos": casos_censurados}

@app.post("/api/salvar_lead")
def salvar_lead(lead: LeadData):
    logger.info(f"💾 Salvando contato: {lead.nome} ({lead.email}) - ID: {lead.id_analise}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM leads WHERE id_analise = ?", (lead.id_analise,))
    if c.fetchone():
        c.execute("UPDATE leads SET nome=?, email=?, whatsapp=?, cidade=? WHERE id_analise=?",
                  (lead.nome, lead.email, lead.whatsapp, lead.cidade, lead.id_analise))
    else:
        c.execute("INSERT INTO leads (nome, email, whatsapp, cidade, resumo_caso, categoria, probabilidade, valor_estimado, id_analise) VALUES (?,?,?,?,?,?,?,?,?)",
                  (lead.nome, lead.email, lead.whatsapp, lead.cidade, lead.resumo, lead.categoria, lead.prob, lead.valor, lead.id_analise))
    conn.commit()
    conn.close()
    return {"status": "saved"}

@app.post("/api/pagar")
def gerar_pagamento(lead: LeadData):
    # Salva contato primeiro
    salvar_lead(lead)

    sdk = mercadopago.SDK(MP_TOKEN)
    try:
        pref = sdk.preference().create({
            "items": [{"title": "Relatório IndenizaAí", "quantity": 1, "unit_price": 9.90}],
            "payer": {"email": lead.email},
            "external_reference": lead.id_analise,
            "back_urls": {"success": "https://indenizaapp.com.br", "failure": "https://indenizaapp.com.br"},
            "auto_return": "approved",
            "notification_url": "https://indenizaapp.com.br/api/webhook"
        })
        return {"link": pref["response"]["init_point"]}
    except: return {"link": "https://mercadopago.com.br"}

# --- PROCESSAMENTO BACKGROUND ---
def processar_sucesso_pagamento(payment_id):
    """
    Função executada em background para processar pagamento aprovado:
    1. Verifica status no Mercado Pago (confirmação final)
    2. Atualiza banco de dados
    3. Gera PDF
    4. Envia E-mail
    """
    logger.info(f"🔄 Iniciando processamento background para pagamento {payment_id}")
    
    try:
        sdk = mercadopago.SDK(MP_TOKEN)
        payment_info = sdk.payment().get(payment_id)
        pay = payment_info.get("response", {})
        
        if pay.get("status") != "approved":
            logger.warning(f"⚠️ Pagamento {payment_id} não aprovado ou pendente. Status: {pay.get('status')}")
            return

        ref = pay.get("external_reference")
        if not ref:
            logger.error(f"❌ Pagamento {payment_id} sem external_reference.")
            return

        # 2. Atualiza Banco de Dados
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("UPDATE leads SET pagou = 1 WHERE id_analise = ?", (ref,))
        conn.commit()
        
        c.execute("SELECT nome, email FROM leads WHERE id_analise = ?", (ref,))
        lead = c.fetchone()
        conn.close()

        if not lead:
            logger.error(f"❌ Lead não encontrado para ref: {ref}")
            return
            
        nome_cliente, email_cliente = lead

        # 3. Recupera Dados e Gera PDF
        dados_analise = get_analise_data(ref)
        if dados_analise:
            dados_analise["pago"] = True
            
            # Gera PDF em memória (pode ser lento)
            pdf_buffer = criar_pdf_bytes(dados_analise, nome_cliente)
            
            # 4. Envia E-mail
            enviar_email_pdf(email_cliente, nome_cliente, pdf_buffer)
            logger.info(f"✅ Processamento concluído para {email_cliente} (Ref: {ref})")
        else:
            logger.error(f"❌ Dados da análise não encontrados no cache/DB para ref: {ref}")

    except Exception as e:
        logger.error(f"❌ Erro fatal no processamento background do pagamento {payment_id}: {e}")
        logger.error(traceback.format_exc())

@app.post("/api/webhook")
async def webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint otimizado: Recebe o hook, valida minimamente e libera a resposta 200 OK.
    Todo o processamento pesado ocorre em background.
    """
    try:
        data = await request.json()
        
        # Log payload para debug (opcional, remover em produção se muito verboso)
        # logger.info(f"📩 Webhook recebido: {data}")

        if data.get("type") == "payment":
            payment_id = data.get("data", {}).get("id")
            if payment_id:
                # Delega processamento para background task imediatamente
                background_tasks.add_task(processar_sucesso_pagamento, payment_id)
                logger.info(f"⏳ Pagamento {payment_id} enviado para processamento em background.")
        
        # Responde rápido para o Mercado Pago não dar timeout
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"❌ Erro ao receber webhook: {e}")
        # Mesmo com erro interno, tentamos responder OK para evitar retry loop infinito do MP se for erro de parse
        return {"status": "error", "detail": str(e)}

@app.get("/api/download_pdf/{id_analise}")
def download_pdf(id_analise: str):
    dados = get_analise_data(id_analise)
    if not dados or not dados.get("pago"): 
        # Double check DB
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT pagou, nome FROM leads WHERE id_analise = ?", (id_analise,))
        row = c.fetchone()
        conn.close()
        if row and row[0] == 1: 
            dados["pago"] = True
            nome = row[1]
        else:
            raise HTTPException(status_code=403, detail="Pagamento pendente")
    else:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT nome FROM leads WHERE id_analise = ?", (id_analise,))
        row = c.fetchone()
        conn.close()
        nome = row[0] if row else "Cliente"

    pdf_buffer = criar_pdf_bytes(dados, nome)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Relatorio_IndenizaAi.pdf"})

@app.get("/api/status_pagamento/{id_analise}")
def verificar_status(id_analise: str):
    dados = get_analise_data(id_analise)
    if dados and dados.get("pago"): return {"pago": True}
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT pagou FROM leads WHERE id_analise = ?", (id_analise,))
    row = c.fetchone()
    conn.close()
    return {"pago": row and row[0] == 1}

@app.get("/api/relatorio/{id_analise}")
def obter_relatorio(id_analise: str):
    analise = get_analise_data(id_analise)
    if not analise: raise HTTPException(status_code=404)
    if not analise.get("pago"):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT pagou FROM leads WHERE id_analise = ?", (id_analise,))
        row = c.fetchone()
        conn.close()
        if row and row[0] == 1: analise["pago"] = True
    
    if analise.get("pago"): return analise
    censurado = analise.copy()
    censurado["casos"] = [{"resumo": "🔒 Conteúdo bloqueado...", "valor": 0, "data": "-", "link": "#", "tipo_resultado": "DERROTA"}] * 3
    return censurado

@app.post("/api/admin/leads")
def listar_leads(auth: AdminAuth):
    if auth.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM leads ORDER BY id DESC", conn)
    conn.close()
    return df.fillna("").to_dict(orient="records")

@app.post("/api/admin/exportar_csv")
def admin_export_csv(auth: AdminAuth):
    if auth.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM leads ORDER BY id DESC", conn)
    conn.close()
    stream = BytesIO()
    df.to_csv(stream, index=False, encoding='utf-8-sig', sep=';')
    stream.seek(0)
    return StreamingResponse(stream, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=Leads.csv"})

@app.get("/api/teste_aprovar/{id_analise}")
def teste_aprovar(id_analise: str):
    logger.info(f"🧪 Aprovando (teste) análise: {id_analise}")
    
    # 1. Atualiza DB
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE leads SET pagou = 1 WHERE id_analise = ?", (id_analise,))
    conn.commit()
    
    # Pega dados para envio de email
    c.execute("SELECT nome, email FROM leads WHERE id_analise = ?", (id_analise,))
    lead = c.fetchone()
    conn.close()
    
    if not lead:
        logger.error(f"❌ Lead não encontrado para id_analise: {id_analise}")
        raise HTTPException(status_code=404, detail="Lead não encontrado para aprovação")
    
    # 2. Atualiza Cache / Recupera JSON
    dados_analise = get_analise_data(id_analise)
    if dados_analise:
        dados_analise["pago"] = True # Garante status
        
        # 3. Envia Email
        logger.info(f"📧 Tentando enviar e-mail para {lead[1]}...")
        try:
            pdf = criar_pdf_bytes(dados_analise, lead[0])
            enviar_email_pdf(lead[1], lead[0], pdf)
            logger.info(f"✅ E-mail enviado com sucesso para {lead[1]}.")
            return {"status": "ok", "mensagem": "E-mail enviado."}
        except Exception as e:
            logger.error(f"❌ Falha no envio do e-mail de teste: {e}")
            raise HTTPException(status_code=500, detail="Falha ao gerar ou enviar o PDF.")
    else:
        logger.error(f"❌ Dados da análise não encontrados no cache/DB para id: {id_analise}")
        raise HTTPException(status_code=404, detail="Dados da análise não encontrados")

# --- PROCESSAMENTO BACKGROUND ADMIN ---
def processar_aprovacao_manual_background(ref):
    """
    Versão simplificada para ADMIN que não consulta Mercado Pago.
    Apenas gera PDF e envia e-mail para um ID já aprovado.
    """
    logger.info(f"🔄 [ADMIN] Processando aprovação manual background: {ref}")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT nome, email FROM leads WHERE id_analise = ?", (ref,))
        lead = c.fetchone()
        conn.close()

        if lead:
            nome_cliente, email_cliente = lead
            dados = get_analise_data(ref)
            if dados:
                dados["pago"] = True
                # Gera PDF
                pdf_buffer = criar_pdf_bytes(dados, nome_cliente)
                # Envia Email
                enviar_email_pdf(email_cliente, nome_cliente, pdf_buffer)
                logger.info(f"✅ [ADMIN] E-mail enviado com sucesso para {email_cliente}.")
        else:
            logger.error(f"❌ [ADMIN] Lead não encontrado: {ref}")
    except Exception as e:
        logger.error(f"❌ Erro aprovação manual background: {e}")

@app.post("/api/admin/reenviar_email")
def admin_reenviar_email(req: AdminActionRequest, background_tasks: BackgroundTasks):
    if req.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    
    # Valida existência
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM leads WHERE id_analise = ?", (req.id_analise,))
    exists = c.fetchone()
    conn.close()
    
    if not exists: raise HTTPException(status_code=404, detail="Lead não encontrado")

    # Reutiliza a função de background (mesma lógica de aprovar = reenviar PDF)
    background_tasks.add_task(processar_aprovacao_manual_background, req.id_analise)

    return {"status": "ok", "mensagem": "E-mail será reenviado em instantes."}

@app.post("/api/admin/aprovar_manual")
def admin_aprovar_manual(req: AdminActionRequest, background_tasks: BackgroundTasks):
    if req.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    
    id_analise = req.id_analise
    logger.info(f"✅ [ADMIN] Aprovação manual solicitada para: {id_analise}")

    # 1. Atualiza Banco
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE leads SET pagou = 1 WHERE id_analise = ?", (id_analise,))
    conn.commit()
    conn.close()

    # 2. Dispara fluxo
    background_tasks.add_task(processar_aprovacao_manual_background, id_analise)

    return {"status": "ok", "mensagem": "Pagamento aprovado. E-mail será enviado em instantes."}

@app.get("/")
def root(): return {"status": "Online", "db": "ChromaDB"}
