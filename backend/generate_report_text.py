import os
import logging
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Configuração de Log
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Configurações do PostgreSQL
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_DB = os.getenv("PG_DB")

def get_db_connection():
    try:
        return psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB
        )
    except Exception as e:
        logger.error(f"❌ Erro ao conectar no PostgreSQL: {e}")
        return None

def generate_daily_report():
    # Relatório sempre do dia ANTERIOR
    target_date = datetime.now().date() - timedelta(days=1)
    
    formatted_date = target_date.strftime("%d/%m/%Y")
    
    conn = get_db_connection()
    if not conn: return "Erro de conexão com banco de dados."

    try:
        with conn.cursor() as cur:
            # 1. Acessos (Clarity)
            cur.execute("SELECT clarity_views FROM daily_metrics WHERE date = %s", (target_date,))
            row = cur.fetchone()
            acessos = row[0] if row else 0

            # 2. Análises Realizadas (Total)
            cur.execute("""
                SELECT COUNT(*) FROM leads 
                WHERE data_registro::date = %s
            """, (target_date,))
            analises_total = cur.fetchone()[0]

            # 3. Análises por Categoria
            cur.execute("""
                SELECT categoria, COUNT(*) as qtd 
                FROM leads 
                WHERE data_registro::date = %s 
                GROUP BY categoria 
                ORDER BY qtd DESC
            """, (target_date,))
            categorias = cur.fetchall()

            # 4. Vendas Realizadas (Pagou = True)
            cur.execute("""
                SELECT COUNT(*), SUM(9.90) FROM leads 
                WHERE pagou = TRUE AND data_registro::date = %s
            """, (target_date,))
            vendas_row = cur.fetchone()
            vendas_qtd = vendas_row[0] or 0
            vendas_valor = vendas_row[1] or 0.0

            # 5. Taxa de Conversão
            conversao = (vendas_qtd / analises_total * 100) if analises_total > 0 else 0

        # Formatação do Texto
        texto = f"📊 *Relatório Diário - IndenizaAí* ({formatted_date})\n\n"
        
        texto += f"👀 *Tráfego (Clarity):* {acessos} acessos\n"
        texto += f"📝 *Análises Realizadas:* {analises_total}\n"
        texto += f"💰 *Vendas:* {vendas_qtd} (R$ {vendas_valor:.2f})\n"
        texto += f"📈 *Conversão:* {conversao:.1f}%\n\n"

        if categorias:
            texto += "*Top Categorias:*\n"
            for cat, qtd in categorias:
                texto += f"- {cat}: {qtd}\n"
        else:
            texto += "_Nenhuma análise registrada._"

        return texto

    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")
        return f"Erro ao gerar relatório: {str(e)}"
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    print(generate_daily_report())
