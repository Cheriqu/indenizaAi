
import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent, ChatBrowserUse

# Carrega as variáveis do arquivo .env (como BROWSER_USE_API_KEY)
load_dotenv()

# Obtém a chave da API do ambiente
api_key = os.getenv("BROWSER_USE_API_KEY")
if not api_key:
    print("ERRO: A variável de ambiente BROWSER_USE_API_KEY não foi encontrada. Certifique-se de que ela está definida no seu arquivo .env.")
    exit(1)

async def run_browser_task():
    print("Inicializando o modelo LLM para tarefas de navegador...")
    try:
        # Usa o modelo recomendado para tarefas de navegador
        llm = ChatBrowserUse()
    except Exception as e:
        print(f"ERRO ao inicializar ChatBrowserUse: {e}")
        exit(1)

    # Define a descrição da tarefa com base na sua solicitação
    task_description = "Navegue para https://indenizaapp.com.br/mission-control e verifique o console do navegador em busca de quaisquer erros JavaScript. Relate quaisquer erros encontrados."
    
    # Inicializa o agente do Browser Use
    # Usamos startUrl para garantir que ele vá direto para a página correta.
    agent = Agent(task=task_description, llm=llm)
    
    print(f"Iniciando a tarefa do navegador para {agent.startUrl}...")
    try:
        # Executa a tarefa. O método agent.run() é assíncrono e deve imprimir o resultado diretamente.
        # O resultado pode incluir logs de console ou um resumo.
        result = await agent.run()
        # Se agent.run() retornar algo explicitamente, podemos imprimir. Caso contrário, esperamos que ele imprima no stdout.
        # Para segurança, vamos verificar se há output via print() dentro do próprio agent.run() (assumindo que o agente faz isso).
        if result:
            print(f"Resultado da tarefa: {result}")
        else:
            print("A tarefa foi executada, mas nenhum resultado explícito foi retornado pela função agent.run(). Verifique o output padrão do agente.")
            
    except Exception as e:
        print(f"Ocorreu um erro durante a execução do agente: {e}")
        exit(1)

if __name__ == "__main__":
    # Executa a função assíncrona principal
    asyncio.run(run_browser_task())
