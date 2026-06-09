import os

def scan_project(startpath):
    exclude_dirs = {'.git', '__pycache__', '.venv', 'env', 'venv', 'node_modules', '.ipynb_checkpoints'}
    exclude_files = {'list_files.py', 'run_list.py', 'scan_project.py'}
    
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        folder_name = os.path.basename(root)
        if level > 0:
            print(f'{indent}📁 {folder_name}/')
        else:
            print(f'📁 {folder_name}/')
        subindent = ' ' * 4 * (level + 1)
        for file in sorted(files):
            if file not in exclude_files and not file.startswith('.'):
                filepath = os.path.join(root, file)
                size = os.path.getsize(filepath)
                print(f'{subindent}📄 {file}  ({size} bytes)')

scan_project(r'c:\Users\MSI-II\Desktop\py_stock\Sposobin')
