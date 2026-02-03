import os
import sqlite3
import pickle
import pandas as pd
import numpy as np
import mercadopago
import json
import traceback
import uuid
import smtplib
import google.generativeai as genai
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from io import BytesIO
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, CrossEncoder
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import quote
import re

# --- REPORTLAB (GERADOR DE PDF) ---
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ImageRL
from reportlab.lib.utils import ImageReader

# Carrega variáveis de ambiente
load_dotenv()

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÕES DE DIRETÓRIOS INTELIGENTES ---
CURRENT_DIR = Path(__file__).resolve().parent
DB_DIR = CURRENT_DIR
ASSETS_DIR = CURRENT_DIR.parent / "public" / "assets"
DB_PATH = DB_DIR / "indeniza.db"

MP_TOKEN = os.getenv("MP_TOKEN")
OPENAI_KEY = os.getenv("OPENROUTER_API_KEY")
SENHA_ADMIN = os.getenv("SENHA_ADMIN", "admin123") # Melhor prática: usar env ou fallback

# Configurações de E-mail
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER", "seu_email@gmail.com")
EMAIL_PASS = os.getenv("EMAIL_PASS", "sua_senha_de_app")

# --- COFRE TEMPORÁRIO (CACHE) ---
ANALISES_CACHE = {}

# --- MODELOS ---
class AnaliseRequest(BaseModel):
    relato: str

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

class AdminAuth(BaseModel):
    senha: str

class AdminActionRequest(BaseModel):
    senha: str
    id_analise: str

# --- CARREGAMENTO DE IA ---
model_bi = None
model_cross = None
df_aereo, vetores_aereo = None, None
df_nome, vetores_nome = None, None
df_bancario, vetores_bancario = None, None
df_luz, vetores_luz = None, None

df_telefonia, vetores_telefonia = None, None

@app.on_event("startup")
def load_models():
    global model_bi, model_cross
    global df_aereo, vetores_aereo, df_nome, vetores_nome
    global df_fraude, vetores_fraude, df_bloqueio, vetores_bloqueio
    global df_corte, vetores_corte, df_corte_luz, vetores_corte_luz
    global df_ecommerce, vetores_ecommerce, df_imob, vetores_imob
    global df_saude, vetores_saude, df_redes, vetores_redes
    global df_seguro, vetores_seguro, df_telefonia, vetores_telefonia
    global df_ensino, vetores_ensino

    print(f"📂 Diretório Base: {CURRENT_DIR}")
    print(f"📂 Diretório Assets (Logo): {ASSETS_DIR}")

    print("Carregando modelos de IA...")
    try:
        model_bi = SentenceTransformer("intfloat/multilingual-e5-large")
        model_cross = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
    except Exception as e: print(f"Erro IA: {e}")

    def load_pkl(filename):
        try:
            caminho = DB_DIR / filename
            if not caminho.exists():
                print(f"⚠️ Arquivo não encontrado: {caminho}")
                return None, None
            with open(caminho, "rb") as f: data = pickle.load(f)
            df = data["dataframe"]
            if "valor_dano_moral" not in df.columns: df["valor_dano_moral"] = 0
            if "valor_dano_material" not in df.columns: df["valor_dano_material"] = 0
            df["valor_dano_moral"] = pd.to_numeric(df["valor_dano_moral"], errors="coerce").fillna(0)
            df["valor_dano_material"] = pd.to_numeric(df["valor_dano_material"], errors="coerce").fillna(0)
            df["valor_total"] = df["valor_dano_moral"] + df["valor_dano_material"]
            print(f"✅ {filename} carregado com {len(df)} linhas.")
            return df, data["vetores"]
        except Exception as e:
            print(f"🔥 Erro ao carregar {filename}: {e}")
            return None, None

    # LOAD ALL DATABASES
    df_aereo, vetores_aereo = load_pkl("banco_aereo.pkl")
    df_nome, vetores_nome = load_pkl("banco_nome_sujo.pkl")
    df_telefonia, vetores_telefonia = load_pkl("banco_telefonia.pkl")
    
    # NEW DATABASES
    df_fraude, vetores_fraude = load_pkl("banco_fraude_pix.pkl")
    df_bloqueio, vetores_bloqueio = load_pkl("banco_bloqueio_bancario.pkl")
    df_corte, vetores_corte = load_pkl("banco_corte_servico_essencial.pkl")
    df_corte_luz, vetores_corte_luz = load_pkl("banco_corte_luz.pkl") # Legacy/Specificity?
    df_ecommerce, vetores_ecommerce = load_pkl("banco_ecommerce.pkl")
    df_imob, vetores_imob = load_pkl("banco_imobiliario.pkl")
    df_saude, vetores_saude = load_pkl("banco_plano_saude.pkl")
    df_redes, vetores_redes = load_pkl("banco_redes_sociais.pkl")
    df_seguro, vetores_seguro = load_pkl("banco_seguradora.pkl")
    df_ensino, vetores_ensino = load_pkl("banco_ensino.pkl") # Might be missing, but logic handles it

# --- INIT DB (COM NOVA COLUNA json_analise) ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Verifica e cria se não existe (incluindo migração manual se precisar)
    c.execute('''CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT, data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        nome TEXT, email TEXT, whatsapp TEXT, cidade TEXT, resumo_caso TEXT, categoria TEXT, 
        probabilidade REAL, valor_estimado REAL, pagou BOOLEAN DEFAULT 0, id_analise TEXT,
        json_analise TEXT
    )''')
    
    # Migração segura: tenta adicionar coluna se não existir
    try:
        c.execute("ALTER TABLE leads ADD COLUMN json_analise TEXT")
    except: pass # Coluna já existe
    
    conn.commit()
    conn.close()

init_db()

# --- HELPERS ---
def formatar_moeda(valor):
    try:
        if valor is None: return "R$ 0,00"
        return f"R$ {float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except: return "R$ 0,00"

def getClassificacao(row):
    # Lógica unificada para Frontend e Backend
    res = str(row.get("resultado", "")).lower()
    val = float(row.get("valor_total", 0))
    # Palavras chave de derrota absoluta
    if "improcedente" in res or "negado" in res or "indeferid" in res: return "DERROTA"
    # Se ganhou algo ou foi parcialmente procedente
    if "parcial" in res or "procedente" in res or val > 0: return "VITORIA"
    # Fallback conservador
    return "DERROTA"

def encontrar_link(row):
    possiveis = ["link_acordao", "link_teor", "link", "url", "url_integra", "inteiro_teor"]
    for nome in possiveis:
        val = str(row.get(nome, ""))
        if val and "http" in val.lower(): return val.strip()
    return "#"

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
            ANALISES_CACHE[id_analise] = dados # Re-hidrata cache
            return dados
        except Exception as e:
            print(f"Erro deserializar: {e}")
    return None

# --- FUNÇÃO GERADORA DE PDF (APRIMORADA) ---
def criar_pdf_bytes(dados_analise, nome_cliente):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # Estilos Personalizados
    styleTitle = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor("#1c80b2"), alignment=1, spaceAfter=20)
    styleSub = ParagraphStyle('Sub', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor("#0f172a"), spaceAfter=10)
    styleBody = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=8)
    styleLink = ParagraphStyle('Link', parent=styles['Normal'], fontSize=8, textColor=colors.blue, underline=True)
    styleResultGreen = ParagraphStyle('Green', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor("#22c55e"), fontName="Helvetica-Bold")
    styleResultGray = ParagraphStyle('Gray', parent=styles['Normal'], fontSize=10, textColor=colors.gray, fontName="Helvetica-Bold")

    # 1. Logo TOPO
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
        except Exception as e:
            print(f"Erro logo: {e}")
            elements.append(Paragraph("INDENIZA AÍ", styleTitle))
    else:
        elements.append(Paragraph("INDENIZA AÍ", styleTitle))

    # Cabeçalho
    elements.append(Paragraph("RELATÓRIO DE ANÁLISE JURIMÉTRICA", styleTitle))
    elements.append(Paragraph(f"Interessado: {nome_cliente}", styleSub))
    elements.append(Spacer(1, 10))

    # Resultados Gerais
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

    # RELATO DO USUÁRIO
    if "relato" in dados_analise:
        elements.append(Paragraph("Seu Relato", styleSub))
        elements.append(Paragraph(f"<i>\"{dados_analise['relato']}\"</i>", styleBody))
        elements.append(Spacer(1, 20))

    # Jurisprudência
    elements.append(Paragraph("Jurisprudência Selecionada (TJPR)", styleSub))
    elements.append(Paragraph("Abaixo listamos decisões reais similares:", styleBody))
    elements.append(Spacer(1, 10))

    for caso in dados_analise["casos"]:
        elements.append(Paragraph(f"<b>Data Julgamento: {caso['data']}</b>", styleBody))
        
        texto_resumo = str(caso['resumo']).replace("<", "&lt;").replace(">", "&gt;")
        elements.append(Paragraph(texto_resumo, styleBody))
        
        # Lógica de Cor/Texto igual ao Frontend
        tipo = caso.get("tipo_resultado", "DERROTA")
        valor_raw = float(caso.get('valor', 0))
        
        if tipo == "VITORIA":
            if valor_raw > 0:
                txt_val = f"Valor da Condenação: {formatar_moeda(valor_raw)}"
            else:
                txt_val = "Valor da Condenação: Não Informado"
            elements.append(Paragraph(txt_val, styleResultGreen))
        else:
             elements.append(Paragraph("Valor da Condenação: Indenização Negada", styleResultGray))

        # Links Clicáveis
        link = caso['link']
        if link and link != '#' and link.startswith('http'):
            try:
                # Encode URL for PDF compatibility
                link_clean = quote(link.strip(), safe='/:?=&%')
                link_html = f'<a href="{link_clean}">CLIQUE AQUI PARA VER O PROCESSO COMPLETO</a>'
                elements.append(Paragraph(link_html, styleLink))
            except: pass
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("_" * 60, styleBody))
        elements.append(Spacer(1, 15))

    # Rodapé
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<font size=8 color=grey>Este documento foi gerado automaticamente por IA. Não substitui consulta jurídica.</font>", styleBody))
    
    # Favicon Rodapé
    fav_path = None
    possible_favs = [ASSETS_DIR / "LOGO_favicon.png", CURRENT_DIR / "LOGO_favicon.png"]
    for p in possible_favs:
        if p.exists():
            fav_path = p
            break
    
    elements.append(Spacer(1, 10))
    if fav_path:
        try:
            im_foot = ImageRL(str(fav_path), width=20, height=20)
            im_foot.hAlign = 'CENTER'
            elements.append(im_foot)
        except: pass
    
    elements.append(Paragraph("<b>Indeniza Aí © 2026</b>", ParagraphStyle('Footer', parent=styles['BodyText'], alignment=1, fontSize=8)))

    doc.build(elements)
    buffer.seek(0)
    return buffer

# --- FUNÇÃO ENVIAR EMAIL ---
def enviar_email_pdf(destinatario, nome, pdf_buffer):
    try:
        if "seu_email" in EMAIL_USER: return
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = destinatario
        msg['Subject'] = "Seu Relatório Indeniza Aí Chegou! ⚖️"
        body = f"Olá, {nome}!\n\nSeu relatório completo de análise jurimétrica está anexo.\n\nAtenciosamente,\nEquipe Indeniza Aí."
        msg.attach(MIMEText(body, 'plain'))
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_buffer.getvalue())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="Relatorio_IndenizaAi_{nome}.pdf"')
        msg.attach(part)
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, destinatario, msg.as_string())
        server.quit()
    except Exception as e: print(f"❌ Erro Email: {e}")

# --- ENDPOINTS ---

# IMPORTS (Add verify imports)
import google.generativeai as genai

# ... code ...

@app.post("/api/analisar")
def analisar_caso(request: AnaliseRequest):
    # Configuração Inicial
    GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=GOOGLE_KEY)
    
    # Prompt Otimizado para JSON
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

    # ESTRATÉGIA 1: Google Gemini (Prioridade 1 - 3.0 Flash)
    # ESTRATÉGIA 2: Google Gemini (Prioridade 2 - 2.0 Flash)
    gemini_models = ["gemini-3-flash-preview", "gemini-2.0-flash"]
    
    for model_name in gemini_models:
        try:
            print(f"🔄 Tentando Gemini: {model_name}...")
            model = genai.GenerativeModel(model_name)
            # Generation Config força resposta JSON
            response = model.generate_content(
                prompt_text,
                generation_config={"response_mime_type": "application/json"}
            )
            raw_content = response.text
            print(f"🤖 Resposta Gemini ({model_name}): {raw_content}")
            
            resp = json.loads(raw_content)
            if resp: break # Sucesso
        except Exception as e:
            print(f"❌ Falha Gemini {model_name}: {e}")
            last_error = e
            continue

    # ESTRATÉGIA 3: OpenRouter (Fallback se Gemini falhar)
    if not resp:
        # ... (OpenRouter code kept as is, just commenting here for context)
        pass 

        # Need to include the OpenRouter block here since we are replacing the whole function body or parts of it?
        # The tool replaces contiguous blocks. The OpenRouter block is inside the original code. 
        # I should output the OpenRouter block too if it falls within StartLine/EndLine, OR adjust StartLine/EndLine to only target the prompt.
        # But I need to update the prompt which is at the start...
        # Let's verify where the OpenRouter block ends. Check previous view_file.
        # Lines 412-437 is OpenRouter.
        # I will just update the prompt part first (Line 377-383) and then the MAPA part (Line 450+).
        # Actually I can do two edits. One for prompt, one for map.
        pass

# ... (This logic is getting complicated because I need to replace non-contiguous parts or include a large chunk)
# Let's do MULTI_REPLACE.



    resp = None
    last_error = None

    # ESTRATÉGIA 1: Google Gemini (Prioridade 1 - 3.0 Flash)
    # ESTRATÉGIA 2: Google Gemini (Prioridade 2 - 2.0 Flash)
    gemini_models = ["gemini-3-flash-preview", "gemini-2.0-flash"]
    
    for model_name in gemini_models:
        try:
            print(f"🔄 Tentando Gemini: {model_name}...")
            model = genai.GenerativeModel(model_name)
            # Generation Config força resposta JSON
            response = model.generate_content(
                prompt_text,
                generation_config={"response_mime_type": "application/json"}
            )
            raw_content = response.text
            print(f"🤖 Resposta Gemini ({model_name}): {raw_content}")
            
            resp = json.loads(raw_content)
            if resp: break # Sucesso
        except Exception as e:
            print(f"❌ Falha Gemini {model_name}: {e}")
            last_error = e
            continue

    # ESTRATÉGIA 3: OpenRouter (Fallback se Gemini falhar)
    if not resp:
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENAI_KEY)
        openrouter_models = [
            "tngtech/deepseek-r1t2-chimera:free", 
            "z-ai/glm-4.5-air:free",
            "meta-llama/llama-3.3-70b-instruct:free"
        ]
        
        for model in openrouter_models:
            try:
                print(f"🔄 Tentando OpenRouter: {model}...")
                check = client.chat.completions.create(
                    model=model, 
                    messages=[{"role": "user", "content": prompt_text + " Responda apenas JSON."}], 
                    temperature=0.1,
                    timeout=30.0 
                )
                raw_content = check.choices[0].message.content
                match = re.search(r'\{.*\}', raw_content, re.DOTALL)
                if match:
                    resp = json.loads(match.group(0))
                    break
            except Exception as e:
                print(f"❌ Falha OpenRouter {model}: {e}")
                last_error = e
                continue

    # SE TUDO FALHAR: Retorna Erro (Sem Mock)
    if not resp:
        print(f"❌ Todas as tentativas de IA falharam. Último erro: {last_error}")
        return {"erro": "IA indisponível no momento. Tente novamente em alguns minutos."}

    # Processamento do Resultado
    if not resp.get("valido"): raise HTTPException(status_code=400, detail="Relato Inválido ou Curto Demais")
    categoria = resp.get("categoria", "OUTROS")
    
    # ... Restante do código de busca vetorial (mantido igual) ...

    mapa = {
        "AEREO": (df_aereo, vetores_aereo),
        "FRAUDE_PIX": (df_fraude, vetores_fraude),
        "BLOQUEIO_BANCARIO": (df_bloqueio, vetores_bloqueio),
        "CORTE_ESSENCIAL": (df_corte, vetores_corte),
        "LUZ": (df_corte_luz, vetores_corte_luz), # Legacy fallback
        "NOME_SUJO": (df_nome, vetores_nome),
        "TELEFONIA": (df_telefonia, vetores_telefonia),
        "PLANO_SAUDE": (df_saude, vetores_saude),
        "IMOBILIARIO": (df_imob, vetores_imob),
        "SEGURADORA": (df_seguro, vetores_seguro),
        "REDES_SOCIAIS": (df_redes, vetores_redes),
        "ECOMMERCE": (df_ecommerce, vetores_ecommerce),
        "ENSINO": (df_ensino, vetores_ensino)
    }
    
    # Roteamento Inteligente
    if categoria not in mapa: categoria = "OUTROS"
    
    df, vetores = mapa.get(categoria, (None, None))
    
    # Se o banco específico não carregou (ou é OUTROS), tenta usar um genérico ou o que tiver mais dados
    # Por padrão, vamos usar Nome Sujo como "fallback genérico" pois é o mais comum, ou frauda pix
    if df is None: 
        print(f"Não tratamos sobre o seu assunto no momento. Fique ligado que em breve podemos adicionar.")

    vetor_query = model_bi.encode([f"query: {request.relato}"])
    simil = cosine_similarity(vetor_query, vetores)[0]
    indices = np.argsort(simil)[-20:][::-1]
    candidatos = df.iloc[indices].copy()
    
    pares = [[request.relato, txt.replace("passage:", "").strip()] for txt in candidatos["texto_para_embedding"]]
    candidatos["score_ia"] = model_cross.predict(pares)
    finais = candidatos.sort_values("score_ia", ascending=False).head(20).copy()
    
    finais["resultado"] = finais.apply(getClassificacao, axis=1)
    vitorias = len(finais[finais["resultado"].str.contains("VITORIA")])
    prob = min((vitorias / 20) * 100, 95.0)
    val = finais[finais["resultado"] == "VITORIA"]["valor_total"].mean() if vitorias > 0 else 0

    casos_completos = []
    casos_censurados = []
    
    # Prepara JSON da análise para ser salvo integralmente
    # Isso permite recriar o relatório depois
    
    for _, row in finais.head(3).iterrows():
        try: d_show = pd.to_datetime(row.get("data_julgamento")).strftime("%d/%m/%Y")
        except: d_show = str(row.get("data_julgamento", ""))
        link = encontrar_link(row)
        
        # Determina tipo para UI
        r_txt = str(row.get("resultado", "")).upper()
        if "VITORIA" in r_txt:
            tipo_res = "VITORIA"
        else:
            tipo_res = "DERROTA"

        casos_completos.append({
            "resumo": str(row.get("resumo", "")), 
            "valor": float(row.get("valor_total",0)), 
            "data": d_show, 
            "link": link,
            "tipo_resultado": tipo_res
        })
        casos_censurados.append({
            "resumo": "🔒 Conteúdo bloqueado...", 
            "valor": float(row.get("valor_total",0)), 
            "data": d_show, 
            "link": "#",
            "tipo_resultado": tipo_res
        })

    id_analise = str(uuid.uuid4())
    
    # Salva Cache RAM
    ANALISES_CACHE[id_analise] = {
        "probabilidade": prob, 
        "valor_estimado": val, 
        "categoria": categoria, 
        "n_casos": len(finais), 
        "casos": casos_completos, 
        "pago": False,
        "relato": request.relato # Salva relato original para PDF
    }

    # CRITICAL: Salva Lead Parcial (Texto da Queixa) imediatamente
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO leads (resumo_caso, categoria, probabilidade, valor_estimado, id_analise, json_analise) VALUES (?,?,?,?,?,?)",
                (request.relato, categoria, prob, val, id_analise, json.dumps(ANALISES_CACHE[id_analise], ensure_ascii=False)))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Erro ao salvar lead parcial: {e}")

    return {"id_analise": id_analise, "probabilidade": prob, "valor_estimado": val, "categoria": categoria, "n_casos": len(finais), "casos": casos_censurados}

@app.post("/api/pagar")
def gerar_pagamento(lead: LeadData):
    # Recupera JSON completo da análise para salvar no banco
    dados_json = None
    if lead.id_analise in ANALISES_CACHE:
        try:
            dados_json = json.dumps(ANALISES_CACHE[lead.id_analise], ensure_ascii=False)
        except: pass

    # Atualiza o lead existente com os dados de contato
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Verifica se existe antes
    c.execute("SELECT id FROM leads WHERE id_analise = ?", (lead.id_analise,))
    exists = c.fetchone()
    
    if exists:
        c.execute("UPDATE leads SET nome=?, email=?, whatsapp=?, cidade=? WHERE id_analise=?",
                  (lead.nome, lead.email, lead.whatsapp, lead.cidade, lead.id_analise))
    else:
        # Fallback caso algo tenha falhado no passo anterior (improvável)
        c.execute("INSERT INTO leads (nome, email, whatsapp, cidade, resumo_caso, categoria, probabilidade, valor_estimado, id_analise, json_analise) VALUES (?,?,?,?,?,?,?,?,?,?)",
                  (lead.nome, lead.email, lead.whatsapp, lead.cidade, lead.resumo, lead.categoria, lead.prob, lead.valor, lead.id_analise, dados_json))
    
    conn.commit()
    conn.close()

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

@app.post("/api/webhook")
async def webhook(request: Request):
    try:
        data = await request.json()
        if data.get("type") == "payment":
            sdk = mercadopago.SDK(MP_TOKEN)
            pay = sdk.payment().get(data["data"]["id"])["response"]
            if pay["status"] == "approved":
                ref = pay["external_reference"]
                
                # 1. Atualiza DB
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("UPDATE leads SET pagou = 1 WHERE id_analise = ?", (ref,))
                conn.commit()
                
                # Pega dados para envio de email
                c.execute("SELECT nome, email FROM leads WHERE id_analise = ?", (ref,))
                lead = c.fetchone()
                conn.close()
                
                # 2. Atualiza Cache / Recupera JSON
                dados_analise = get_analise_data(ref)
                if dados_analise:
                    dados_analise["pago"] = True # Garante status
                    
                    # 3. Envia Email
                    if lead:
                        pdf = criar_pdf_bytes(dados_analise, lead[0])
                        enviar_email_pdf(lead[1], lead[0], pdf)

        return {"status": "ok"}
    except: return {"status": "error"}

@app.get("/api/download_pdf/{id_analise}")
def download_pdf(id_analise: str):
    # Usa helper que busca no Cache E no DB
    dados = get_analise_data(id_analise)
    if not dados: raise HTTPException(status_code=404, detail="Dados expirados")
    
    # Verifica pagamento
    if not dados.get("pago"):
        # Double check no banco só pra garantir
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT pagou FROM leads WHERE id_analise = ?", (id_analise,))
        row = c.fetchone()
        conn.close()
        if row and row[0] == 1: dados["pago"] = True
        else: raise HTTPException(status_code=403, detail="Pagamento pendente")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT nome FROM leads WHERE id_analise = ?", (id_analise,))
    row = c.fetchone()
    conn.close()
    nome_cliente = row[0] if row else "Cliente"

    pdf_buffer = criar_pdf_bytes(dados, nome_cliente)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Relatorio_IndenizaAi.pdf"}
    )

@app.get("/api/teste_aprovar/{id_analise}")
def teste_aprovar(id_analise: str):
    # Atualiza DB
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE leads SET pagou = 1 WHERE id_analise = ?", (id_analise,))
    conn.commit()
    conn.close()
    
    # Atualiza RAM se tiver
    dados = get_analise_data(id_analise)
    if dados: dados["pago"] = True
    
    return {"status": "ok"}

@app.get("/api/status_pagamento/{id_analise}")
def verificar_status(id_analise: str):
    # Usa o helper inteligente que unifica Cache+DB
    dados = get_analise_data(id_analise)
    if dados and dados.get("pago"): return {"pago": True}
    
    # Fallback DB Bruto
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT pagou FROM leads WHERE id_analise = ?", (id_analise,))
    row = c.fetchone()
    conn.close()
    if row and row[0] == 1: return {"pago": True}
    return {"pago": False}

@app.get("/api/relatorio/{id_analise}")
def obter_relatorio(id_analise: str):
    # Helper inteligente
    analise = get_analise_data(id_analise)
    if not analise: raise HTTPException(status_code=404, detail="Análise não encontrada")
    
    if not analise.get("pago"):
        # Check DB antes de negar
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT pagou FROM leads WHERE id_analise = ?", (id_analise,))
        row = c.fetchone()
        conn.close()
        if row and row[0] == 1: analise["pago"] = True
    
    if analise.get("pago"): return analise
    
    # Versão Censurada
    censurado = analise.copy()
    censurado["casos"] = [{"resumo": "🔒 Conteúdo bloqueado...", "valor": 0, "data": "-", "link": "#", "tipo_resultado": "DERROTA"}] * 3
    return censurado

@app.post("/api/admin/leads")
def listar_leads(auth: AdminAuth):
    if auth.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    conn = sqlite3.connect(DB_PATH)
    # Incluindo resumo_caso para ver o texto da queixa
    df = pd.read_sql_query("SELECT id, data_registro, nome, email, whatsapp, cidade, categoria, probabilidade, valor_estimado, pagou, resumo_caso FROM leads ORDER BY id DESC", conn)
    conn.close()
    df = df.fillna("") # Garante que Nones virem strings vazias para o frontend
    return df.to_dict(orient="records")

@app.post("/api/admin/reenviar_email")
def admin_reenviar(req: AdminActionRequest):
    if req.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    # Busca dados
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT nome, email FROM leads WHERE id_analise = ?", (req.id_analise,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404, "Lead não encontrado")
    
    dados = get_analise_data(req.id_analise)
    if not dados: raise HTTPException(404, "Dados perdidos")
    dados["pago"] = True
    
    try:
        pdf = criar_pdf_bytes(dados, row[0])
        enviar_email_pdf(row[1], row[0], pdf)
        return {"status": "ok", "mensagem": "Reenviado"}
    except Exception as e: return {"status": "error", "mensagem": str(e)}

@app.post("/api/admin/aprovar_manual")
def admin_aprovar(req: AdminActionRequest):
    if req.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    teste_aprovar(req.id_analise) # Reusa lógica
    return {"status": "ok"}

@app.post("/api/admin/exportar_csv")
def admin_export_csv(auth: AdminAuth):
    if auth.senha != SENHA_ADMIN: raise HTTPException(status_code=401)
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT id, data_registro, nome, email, whatsapp, cidade, categoria, probabilidade, valor_estimado, pagou FROM leads ORDER BY id DESC", conn)
    conn.close()
    stream = BytesIO()
    df.to_csv(stream, index=False, encoding='utf-8-sig', sep=';')
    stream.seek(0)
    return StreamingResponse(stream, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=Leads.csv"})

@app.get("/")
def root(): return {"status": "Online"}
