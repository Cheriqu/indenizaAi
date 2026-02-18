import os
import json
import logging
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Configuração de Log
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

OPENCLAW_CRON_FILE = "/root/.openclaw/cron/jobs.json"

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

def sync_cron_tasks():
    """Lê o arquivo de jobs do OpenClaw e atualiza a tabela scheduled_tasks no banco."""
    if not os.path.exists(OPENCLAW_CRON_FILE):
        logger.warning(f"⚠️ Arquivo de cron não encontrado: {OPENCLAW_CRON_FILE}")
        return

    conn = get_db_connection()
    if not conn:
        return

    try:
        with open(OPENCLAW_CRON_FILE, 'r') as f:
            jobs_data = json.load(f)
        
        jobs_list = jobs_data.get('jobs', [])
        
        with conn.cursor() as cur:
            # Limpa tabela atual para garantir sync perfeito
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
            logger.info(f"✅ Painel Mission Control atualizado: {len(jobs_list)} tarefas sincronizadas.")

    except Exception as e:
        logger.error(f"❌ Erro ao sincronizar tarefas no banco: {e}")
        conn.rollback()
    finally:
        conn.close()
