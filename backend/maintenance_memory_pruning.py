import os
import logging
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from cron_utils import sync_cron_tasks

# Configuração de Log
logging.basicConfig(
    filename='/var/www/indeniza/backend/cron_maintenance.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load env for API Key
load_dotenv('/var/www/indeniza/backend/.env')
GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")

WORKSPACE_DIR = Path("/root/.openclaw/workspace")
MEMORY_DIR = WORKSPACE_DIR / "memory"
TOOLS_FILE = WORKSPACE_DIR / "TOOLS.md"

def prune_memory():
    if not GOOGLE_KEY:
        logger.error("❌ GOOGLE_API_KEY not found. Aborting.")
        return

    client = genai.Client(api_key=GOOGLE_KEY)
    
    # Pega arquivos de memória recentes (últimos 3 dias)
    # Não queremos mexer em arquivos muito antigos automaticamente sem supervisão
    files_to_check = sorted(MEMORY_DIR.glob("*.md"), reverse=True)[:3]
    
    if not files_to_check:
        logger.info("Nenhum arquivo de memória para processar.")
        return

    logger.info(f"🔍 Iniciando análise de memória em: {[f.name for f in files_to_check]}")

    for file_path in files_to_check:
        content = file_path.read_text(encoding="utf-8")
        if not content.strip(): continue

        # Prompt para a IA identificar o que mover
        prompt = f"""
        Analyze the following memory file content. Identify specific technical details that should be moved to 'TOOLS.md' (local configuration, secrets, specific commands, environment variables) or are generic usage instructions better suited for a Skill documentation.

        If you find such info, extract it and rewrite the memory content WITHOUT that info.
        
        Rules:
        1. Only move STATIC technical facts (IPs, specific paths, fixed commands).
        2. Do NOT move project context, decisions, or conversations.
        3. Return JSON with fields: 
           - 'tools_append': Text to append to TOOLS.md (or null)
           - 'new_memory_content': The memory file content with the technical details removed (cleaned up).
        
        Memory Content:
        {content}
        """

        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type='application/json'
                )
            )
            
            result = response.parsed
            
            # Processar TOOLS.md
            if result and hasattr(result, 'tools_append') and result.tools_append:
                append_text = f"\n\n### Extracted from {file_path.name} ({datetime.now().strftime('%Y-%m-%d')})\n{result.tools_append}"
                with open(TOOLS_FILE, "a", encoding="utf-8") as f:
                    f.write(append_text)
                logger.info(f"✅ Movido conteúdo de {file_path.name} para TOOLS.md")

                # Atualizar arquivo de memória (apenas se houve extração)
                if result.new_memory_content and len(result.new_memory_content) < len(content):
                    file_path.write_text(result.new_memory_content, encoding="utf-8")
                    logger.info(f"🧹 Memória limpa: {file_path.name}")
            
        except Exception as e:
            logger.error(f"Erro ao processar {file_path.name}: {e}")

if __name__ == "__main__":
    sync_cron_tasks()
    prune_memory()
