import os, sys, subprocess
result = subprocess.run([sys.executable, 'list_files.py'], capture_output=True, text=True, cwd=r'c:\Users\MSI-II\Desktop\py_stock\Sposobin')
print(result.stdout)
print(result.stderr)
