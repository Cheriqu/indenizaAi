import os
import psycopg2
from psycopg2.extras import DictCursor
import requests
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Configuração de Log
logging.basicConfig(
    filename='recovery.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()

# Configurações
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_DB = os.getenv("PG_DB")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB
        )
        return conn
    except Exception as e:
        logger.error(f"❌ Erro conexão DB: {e}")
        return None

def enviar_email_recuperacao(destinatario, nome, valor_estimado, probabilidade, link_recuperacao):
    if not BREVO_API_KEY:
        logger.error("❌ API Key da Brevo não encontrada.")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    
    nome_tratado = nome if nome else "Cliente"
    valor_fmt = f"R$ {float(valor_estimado):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    prob_fmt = f"{float(probabilidade):.0f}%"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1c80b2; text-align: center;">Não deixe sua indenização para trás! ⚖️</h2>
            <p>Olá, <strong>{nome_tratado}</strong>.</p>
            <p>Vimos que você fez uma análise do seu caso recentemente, mas não finalizou o processo para receber seu relatório completo e orientações.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;">💰 <strong>Valor Estimado:</strong> <span style="color: #22c55e; font-size: 18px;">{valor_fmt}</span></p>
                <p style="margin: 5px 0;">📈 <strong>Probabilidade de Êxito:</strong> {prob_fmt}</p>
            </div>

            <p>Nossa inteligência artificial encontrou casos muito parecidos com o seu no Tribunal de Justiça. Você tem grandes chances.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{link_recuperacao}" style="background-color: #1c80b2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    RETOMAR MINHA ANÁLISE
                </a>
            </div>
            
            <p style="font-size: 12px; color: #777; text-align: center;">
                Se o botão não funcionar, clique aqui: <br>
                <a href="{link_recuperacao}">{link_recuperacao}</a>
            </p>
        </div>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": "Equipe Indeniza Aí", "email": "contato@indenizaapp.com.br"},
        "to": [{"email": destinatario, "name": nome_tratado}],
        "subject": f"Você esqueceu {valor_fmt} para trás? ⚖️",
        "htmlContent": html_content
    }
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201, 202]:
            return True
        else:
            logger.error(f"❌ Erro Brevo: {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Erro Request: {e}")
        return False

def processar_recuperacao():
    logger.info("🔄 Iniciando rotina de recuperação de carrinho...")
    conn = get_db_connection()
    if not conn: return

    try:
        # Busca leads:
        # 1. Não pagos (pagou = false)
        # 2. Não recuperados (email_recuperacao_enviado = false)
        # 3. Criados há mais de 1h
        # 4. Criados há menos de 24h
        # 5. Com email válido
        query = """
            SELECT id, nome, email, valor_estimado, probabilidade, id_analise 
            FROM leads 
            WHERE pagou = FALSE 
            AND email_recuperacao_enviado = FALSE
            AND email IS NOT NULL AND email != ''
            AND data_registro < NOW() - INTERVAL '1 hour'
            AND data_registro > NOW() - INTERVAL '24 hours'
        """
        
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute(query)
            leads = cur.fetchall()
            
            logger.info(f"📂 Encontrados {len(leads)} leads para recuperação.")

            for lead in leads:
                link = f"https://indenizaapp.com.br/?recover={lead['id_analise']}"
                
                sucesso = enviar_email_recuperacao(
                    lead['email'], 
                    lead['nome'], 
                    lead['valor_estimado'], 
                    lead['probabilidade'], 
                    link
                )

                if sucesso:
                    # Marca como enviado para NÃO ENVIAR NOVAMENTE
                    cur.execute("UPDATE leads SET email_recuperacao_enviado = TRUE WHERE id = %s", (lead['id'],))
                    conn.commit()
                    logger.info(f"✅ E-mail enviado para {lead['email']} (ID: {lead['id']})")
                else:
                    logger.warning(f"⚠️ Falha ao enviar para {lead['email']}")

    except Exception as e:
        logger.error(f"❌ Erro no loop de recuperação: {e}")
    finally:
        conn.close()
        logger.info("🏁 Rotina finalizada.")

if __name__ == "__main__":
    processar_recuperacao()
