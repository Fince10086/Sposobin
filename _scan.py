import os

def scan(startpath):
    exclude = {'.git', '__pycache__', '.venv', 'env', 'venv', 'node_modules', '.ipynb_checkpoints'}
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude]
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')
        sub = ' ' * 4 * (level + 1)
        for f in sorted(files):
            fp = os.path.join(root, f)
            sz = os.path.getsize(fp)
            print(f'{sub}{f}  ({sz} bytes)')

scan(r'c:\Users\MSI-II\Desktop\py_stock\Sposobin')
