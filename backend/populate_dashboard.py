
import psycopg2
import os
import json
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Carrega ambiente
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
        # --- 1. Popular Activity Logs (Baseado em eventos recentes e roadmap) ---
        print("Populando Activity Logs...")
        
        eventos = [
            ("2026-02-14 14:00:00", "DEPLOY", {"detail": "Deploy Mission Control v1.0", "target": "production"}, "SUCCESS"),
            ("2026-02-14 11:05:00", "FEATURE", {"detail": "Implementação Audio Recorder", "tech": "React+Gemini"}, "SUCCESS"),
            ("2026-02-14 10:45:00", "TASK", {"detail": "Revisão de Roadmap", "status": "reviewed"}, "SUCCESS"),
            ("2026-02-13 18:30:00", "FIX", {"detail": "Correção envio de e-mail SMTP", "provider": "Brevo"}, "SUCCESS"),
            ("2026-02-12 15:20:00", "MIGRATION", {"detail": "Migração SQLite -> PostgreSQL", "impact": "High"}, "SUCCESS"),
            ("2026-02-12 14:00:00", "SECURITY", {"detail": "Configuração UFW Firewall", "ports": "22, 80, 443"}, "SUCCESS"),
            ("2026-02-12 09:00:00", "SETUP", {"detail": "Setup inicial VPS Contabo", "os": "Ubuntu 24.04"}, "SUCCESS"),
        ]

        for timestamp, action, details, status in eventos:
            cur.execute("""
                INSERT INTO activity_logs (timestamp, action, details, status)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (timestamp, action, json.dumps(details), status))

        # --- 2. Popular Scheduled Tasks (Baseado em cron e planejamento) ---
        print("Populando Scheduled Tasks...")
        
        tarefas = [
            ("Recuperação de Carrinho", "0 * * * *", datetime.now() - timedelta(minutes=30), datetime.now() + timedelta(minutes=30), True),
            ("Backup Diário PostgreSQL", "0 3 * * *", datetime.now() - timedelta(hours=12), datetime.now() + timedelta(hours=12), True),
            ("Relatório Semanal de Leads", "0 8 * * 1", datetime.now() - timedelta(days=2), datetime.now() + timedelta(days=5), True),
            ("Atualização Certificado SSL", "0 0 1 * *", datetime.now() - timedelta(days=14), datetime.now() + timedelta(days=16), True),
            ("Análise de Logs de Erro (Sentry)", "*/15 * * * *", datetime.now(), datetime.now() + timedelta(minutes=15), True),
            ("Limpeza de Arquivos Temporários", "0 4 * * *", datetime.now() - timedelta(hours=10), datetime.now() + timedelta(hours=14), True)
        ]

        # Limpa tarefas antigas de teste para reinserir limpo
        cur.execute("DELETE FROM scheduled_tasks WHERE id > 0")

        for name, cron, last, next_run, active in tarefas:
            cur.execute("""
                INSERT INTO scheduled_tasks (task_name, schedule_cron, last_run, next_run, active)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, cron, last, next_run, active))

        # --- 3. Extrair histórico do Roadmap.md ---
        # Tenta ler o arquivo Roadmap.md e adicionar itens concluídos como logs antigos
        try:
            roadmap_path = Path("/var/www/indeniza/Roadmap.md")
            if roadmap_path.exists():
                with open(roadmap_path, "r", encoding='utf-8') as f:
                    content = f.read()
                    # Regex para encontrar itens concluídos: - [x] **TITULO**: DESCRICAO
                    pattern = r"- \[x\] \*\*(.*?)\*\*: (.*)"
                    completed_tasks = re.findall(pattern, content)
                    
                    if not completed_tasks:
                        # Tenta regex alternativo se falhar
                        pattern = r"- \[x\] \*\*(.*?)\*\* (.*)"
                        completed_tasks = re.findall(pattern, content)
                    
                    base_date = datetime(2026, 2, 10, 12, 0, 0) # Data base ficticia para itens passados
                    
                    print(f"Encontrados {len(completed_tasks)} itens no roadmap.")
                    
                    for i, (title, desc) in enumerate(completed_tasks):
                        ts = base_date + timedelta(hours=i*4)
                        details_json = json.dumps({"description": desc.strip()})
                        
                        # Usa ON CONFLICT DO NOTHING para evitar duplicar se rodar de novo (assumindo timestamp único ou chave)
                        # Como não temos chave única no log além do ID, vamos apenas inserir.
                        # Para evitar flood, verificamos se ja existe log similar
                        cur.execute("""
                            SELECT id FROM activity_logs 
                            WHERE action = 'ROADMAP_COMPLETE' AND details->>'description' = %s
                        """, (desc.strip(),))
                        
                        if not cur.fetchone():
                            cur.execute("""
                                INSERT INTO activity_logs (timestamp, action, details, status)
                                VALUES (%s, 'ROADMAP_COMPLETE', %s, 'SUCCESS')
                            """, (ts, details_json))
                        
                print(f"✅ Itens do Roadmap processados.")
        except Exception as e:
            print(f"⚠️ Erro ao processar Roadmap.md: {e}")

    conn.commit()
    print("✅ Dados populados com sucesso!")

except Exception as e:
    print(f"❌ Erro ao popular dados: {e}")
    conn.rollback()
finally:
    if 'conn' in locals() and conn:
        conn.close()
