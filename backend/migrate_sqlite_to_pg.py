import os
import sqlite3
import psycopg2
import logging
from datetime import datetime

# Configuração de Log
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações do Banco
SQLITE_DB_PATH = 'indeniza.db'
PG_HOST = 'localhost'
PG_PORT = 5432
PG_USER = 'indeniza'
PG_PASSWORD = 'tO6iaBa/yhSJACA5Xq17yg=='
PG_DB = 'indeniza_db'

def create_table_postgres(pg_conn):
    """Cria a tabela leads no PostgreSQL se não existir"""
    try:
        with pg_conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS leads (
                    id SERIAL PRIMARY KEY,
                    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    nome TEXT,
                    email TEXT,
                    whatsapp TEXT,
                    cidade TEXT,
                    resumo_caso TEXT,
                    categoria TEXT,
                    probabilidade REAL,
                    valor_estimado REAL,
                    pagou BOOLEAN DEFAULT FALSE,
                    id_analise TEXT UNIQUE,
                    json_analise TEXT
                );
            """)
        pg_conn.commit()
        logger.info("✅ Tabela 'leads' criada/verificada no PostgreSQL.")
    except Exception as e:
        pg_conn.rollback()
        logger.error(f"❌ Erro ao criar tabela no PostgreSQL: {e}")
        raise e

def migrate_data():
    """Lê dados do SQLite e insere no PostgreSQL"""
    
    # 1. Conexão SQLite
    if not os.path.exists(SQLITE_DB_PATH):
        logger.error(f"❌ Banco SQLite não encontrado em {SQLITE_DB_PATH}")
        return

    logger.info("🔌 Conectando ao SQLite...")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # 2. Conexão PostgreSQL
    logger.info("🔌 Conectando ao PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB
        )
    except Exception as e:
        logger.error(f"❌ Falha na conexão com PostgreSQL: {e}")
        return

    try:
        # Criar Tabela
        create_table_postgres(pg_conn)

        # Ler SQLite
        sqlite_cursor.execute("SELECT * FROM leads ORDER BY id ASC")
        rows = sqlite_cursor.fetchall()
        logger.info(f"📂 Encontrados {len(rows)} registros no SQLite.")

        with pg_conn.cursor() as pg_cursor:
            inserted_count = 0
            skipped_count = 0
            
            for row in rows:
                # Mapeia colunas SQLite -> PostgreSQL
                data = dict(row)
                
                # Conversão de Tipos (se necessário)
                # SQLite salva booleans como 0/1, Postgres aceita True/False ou 0/1.
                # Datas do SQLite são strings, Postgres converte auto se formato ISO.

                try:
                    # Verifica duplicidade pelo id_analise (Unique)
                    pg_cursor.execute("SELECT 1 FROM leads WHERE id_analise = %s", (data['id_analise'],))
                    if pg_cursor.fetchone():
                        skipped_count += 1
                        continue

                    # Insert
                    pg_cursor.execute("""
                        INSERT INTO leads (
                            data_registro, nome, email, whatsapp, cidade, 
                            resumo_caso, categoria, probabilidade, valor_estimado, 
                            pagou, id_analise, json_analise
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        data['data_registro'], data['nome'], data['email'], data['whatsapp'], data['cidade'],
                        data['resumo_caso'], data['categoria'], data['probabilidade'], data['valor_estimado'],
                        bool(data['pagou']), data['id_analise'], data['json_analise']
                    ))
                    inserted_count += 1
                except Exception as row_error:
                    logger.error(f"⚠️ Erro ao migrar linha ID {data.get('id')}: {row_error}")
            
            pg_conn.commit()
            logger.info(f"✅ Migração Concluída: {inserted_count} inseridos, {skipped_count} pulados (duplicados).")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"❌ Erro geral na migração: {e}")
    finally:
        sqlite_conn.close()
        pg_conn.close()
        logger.info("🔌 Conexões fechadas.")

if __name__ == "__main__":
    migrate_data()
