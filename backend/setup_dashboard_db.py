
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

# Força o carregamento do .env correto
env_path = Path("/var/www/indeniza/backend/.env")
load_dotenv(dotenv_path=env_path)

PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_DB = os.getenv("PG_DB")

print(f"Tentando conectar: Host={PG_HOST}, User={PG_USER}, DB={PG_DB}")

try:
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_USER,
        password=PG_PASSWORD,
        dbname=PG_DB
    )
    
    with conn.cursor() as cur:
        # Tabela de Logs de Atividade
        print("Criando tabela activity_logs...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                action TEXT NOT NULL,
                details JSONB,
                status TEXT DEFAULT 'SUCCESS'
            );
        """)
        
        # Cria índices para busca rápida
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp DESC);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action);")
        
        # Tabela de Tarefas Agendadas (opcional, se quisermos persistir jobs futuros além do cron)
        print("Criando tabela scheduled_tasks...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_tasks (
                id SERIAL PRIMARY KEY,
                task_name TEXT NOT NULL,
                schedule_cron TEXT NOT NULL,
                last_run TIMESTAMP,
                next_run TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        """)

        # Insere dados iniciais de exemplo/configuração
        cur.execute("INSERT INTO scheduled_tasks (task_name, schedule_cron) VALUES ('Recuperação de Carrinho', '0 * * * *') ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO scheduled_tasks (task_name, schedule_cron) VALUES ('Backup Diário', '0 3 * * *') ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO scheduled_tasks (task_name, schedule_cron) VALUES ('Relatório Semanal', '0 8 * * 1') ON CONFLICT DO NOTHING;")

    conn.commit()
    print("✅ Tabelas criadas com sucesso!")

except Exception as e:
    print(f"❌ Erro ao criar tabelas: {e}")
    conn.rollback()
finally:
    if 'conn' in locals() and conn:
        conn.close()
