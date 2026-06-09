import os

temp_files = ['list_files.py', 'run_list.py', 'scan_project.py']
project_dir = r'c:\Users\MSI-II\Desktop\py_stock\Sposobin'

for f in temp_files:
    path = os.path.join(project_dir, f)
    if os.path.exists(path):
        os.remove(path)
        print(f'已删除: {f}')
    else:
        print(f'文件不存在: {f}')
