import os
import logging
import requests
import json
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Configuração de Log
logging.basicConfig(
    filename='cron_analytics.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
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
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB
        )
        return conn
    except Exception as e:
        logger.error(f"❌ Erro ao conectar no PostgreSQL: {e}")
        return None

def sync_cron_tasks(conn):
    """Sync OpenClaw cron jobs from JSON file to Postgres."""
    if not os.path.exists(OPENCLAW_CRON_FILE):
        logger.warning(f"⚠️ OpenClaw cron file not found: {OPENCLAW_CRON_FILE}")
        return

    try:
        with open(OPENCLAW_CRON_FILE, 'r') as f:
            jobs_data = json.load(f)
        
        jobs_list = jobs_data.get('jobs', [])
        if not jobs_list:
            logger.info("ℹ️ Nenhum job encontrado no arquivo JSON.")
            return

        with conn.cursor() as cur:
            # Limpa tabela atual para garantir sync perfeito (full refresh)
            cur.execute("TRUNCATE TABLE scheduled_tasks RESTART IDENTITY")
            
            for job in jobs_list:
                name = job.get('name', 'Sem Nome')
                enabled = job.get('enabled', True)
                schedule = job.get('schedule', {})
                expr = schedule.get('expr', 'N/A')
                state = job.get('state', {})
                
                # Convert timestamps (ms) to datetime
                last_run_ms = state.get('lastRunAtMs')
                next_run_ms = state.get('nextRunAtMs')
                
                last_run = datetime.fromtimestamp(last_run_ms / 1000.0) if last_run_ms else None
                next_run = datetime.fromtimestamp(next_run_ms / 1000.0) if next_run_ms else None

                cur.execute("""
                    INSERT INTO scheduled_tasks (task_name, schedule_cron, active, last_run, next_run)
                    VALUES (%s, %s, %s, %s, %s)
                """, (name, expr, enabled, last_run, next_run))
            
            conn.commit()
            logger.info(f"✅ Sincronizados {len(jobs_list)} cron jobs para o banco de dados.")

    except Exception as e:
        logger.error(f"❌ Erro ao sincronizar cron jobs: {e}")
        conn.rollback()

def get_clarity_metrics():
    """Busca métricas do Microsoft Clarity via API de Exportação."""
    token = os.getenv("CLARITY_API_TOKEN")
    if not token:
        logger.error("❌ CLARITY_API_TOKEN não encontrado no .env")
        return None

    url = "https://www.clarity.ms/export-data/api/v1/project-live-insights"
    params = {
        "numOfDays": "1",  # Últimas 24h
        "dimension1": "Device" # Quebra por dispositivo (Mobile/Desktop)
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Processar resposta
        traffic_data = next((item for item in data if item["metricName"] == "Traffic"), None)
        
        if traffic_data:
            total_sessions = sum(int(info["totalSessionCount"]) for info in traffic_data["information"])
            bot_sessions = sum(int(info.get("totalBotSessionCount", 0)) for info in traffic_data["information"])
            
            # Clarity separa bots. TotalSessionCount é geralmente tráfego válido.
            human_sessions = total_sessions 
            
            logger.info(f"📊 Clarity (Últimas 24h): {human_sessions} sessões humanas ({bot_sessions} bots)")
            return human_sessions
        else:
            logger.warning("⚠️ Clarity: Métrica 'Traffic' não encontrada na resposta.")
            return 0

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erro ao conectar com API Clarity: {str(e)}")
        return 0

from cron_utils import sync_cron_tasks

def collect_daily_metrics():
    logger.info("🚀 Iniciando Coleta Diária de Analytics...")
    
    # 0. Sync Cron Tasks (Atualiza Painel)
    sync_cron_tasks()
    
    conn = get_db_connection()
    if not conn:
        logger.error("❌ Falha na conexão com o banco. Abortando.")
        return

    try:
        # 1. Coleta Leads do Dia (Real)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) FROM leads 
                WHERE data_registro >= CURRENT_DATE 
                AND data_registro < CURRENT_DATE + INTERVAL '1 day'
            """)
            result = cur.fetchone()
            leads_count = result[0] if result else 0
            
        logger.info(f"✅ Leads coletados hoje: {leads_count}")

        # 2. Coleta Acessos Clarity
        clarity_views = get_clarity_metrics()
        
        # 3. Salvar Consolidação (Upsert)
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO daily_metrics (date, leads_count, clarity_views)
                VALUES (CURRENT_DATE, %s, %s)
                ON CONFLICT (date) DO UPDATE 
                SET leads_count = EXCLUDED.leads_count,
                    clarity_views = EXCLUDED.clarity_views,
                    created_at = NOW();
            """, (leads_count, clarity_views))
            conn.commit()
            
        logger.info("💾 Métricas salvas no banco de dados com sucesso.")

    except Exception as e:
        logger.error(f"❌ Erro ao salvar métricas diárias: {e}")
        if conn: conn.rollback()
    finally:
        if conn: conn.close()
        logger.info("💾 Fim da execução.")

if __name__ == "__main__":
    collect_daily_metrics()
