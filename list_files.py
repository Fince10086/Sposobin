import os

def list_files(startpath):
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d != '.git' and d != '__pycache__' and d != '.venv' and d != 'node_modules']
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 4 * (level + 1)
        for file in files:
            if not file.startswith('.'):
                print(f'{subindent}{file}')

path = r'c:\Users\MSI-II\Desktop\py_stock\Sposobin'
list_files(path)
