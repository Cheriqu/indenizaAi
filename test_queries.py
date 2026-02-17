import pandas as pd
import psycopg2
import json

conn = psycopg2.connect(
    host="localhost",
    user="indeniza",
    password="tO6iaBa/yhSJACA5Xq17yg==",
    dbname="indeniza_db"
)

try:
    print("--- LOGS ---")
    query_logs = """
        SELECT id, timestamp as created_at, status as level, action, details::text 
        FROM activity_logs 
        ORDER BY timestamp DESC 
        LIMIT 5
    """
    df_logs = pd.read_sql_query(query_logs, conn)
    print(df_logs.head())

    print("\n--- TASKS ---")
    query_tasks = """
        SELECT id, name as task_name, status, last_run as last_run_at, next_run as next_run_at, results::text as result 
        FROM scheduled_tasks 
        ORDER BY next_run ASC 
        LIMIT 5
    """
    df_tasks = pd.read_sql_query(query_tasks, conn)
    print(df_tasks.head())

except Exception as e:
    print("ERRO:", e)
finally:
    conn.close()
