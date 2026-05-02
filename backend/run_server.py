import subprocess
import sys
subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
