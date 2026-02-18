import pandas as pd
import psycopg2
import json

PG_HOST = "localhost"
PG_PORT = "5432"
PG_USER = "indeniza"
PG_PASSWORD = "tO6iaBa/yhSJACA5Xq17yg=="
PG_DB = "indeniza_db"

conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    user=PG_USER,
    password=PG_PASSWORD,
    dbname=PG_DB
)

try:
    print("--- LOGS ---")
    df_logs = pd.read_sql_query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5", conn)
    print(df_logs)
    print("JSON Logs:", df_logs.fillna("").to_dict(orient="records"))

    print("\n--- TASKS ---")
    df_tasks = pd.read_sql_query("SELECT * FROM scheduled_tasks ORDER BY next_run_at ASC LIMIT 5", conn)
    print(df_tasks)
    print("JSON Tasks:", df_tasks.fillna("").to_dict(orient="records"))

except Exception as e:
    print("ERRO:", e)
finally:
    conn.close()
