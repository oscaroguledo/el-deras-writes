import subprocess
import os
import sys

def run_command(command, cwd=None):
    """Runs a shell command and prints its output."""
    print(f"Running command: {' '.join(command)} in {cwd if cwd else os.getcwd()}")
    process = subprocess.Popen(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end='')
    process.wait()
    if process.returncode != 0:
        print(f"Command failed with exit code {process.returncode}")
        sys.exit(process.returncode)

def deploy_production():
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, '.')

    print("--- Starting Production Deployment ---")

    # Step 1: Apply Django Migrations
    print("\n--- Applying Django Migrations ---")
    run_command([sys.executable, 'manage.py', 'makemigrations'], cwd=backend_dir)
    run_command([sys.executable, 'manage.py', 'migrate'], cwd=backend_dir)

    # Step 2: Create Superuser from file
    print("\n--- Creating Superuser from user.txt ---")
    run_command([sys.executable, 'create_superuser_from_file.py'], cwd=backend_dir)
    
    # Step 3: Start Django Development Server (NOT RECOMMENDED FOR PRODUCTION)
    print("\n--- Starting Django Development Server (WARNING: NOT RECOMMENDED FOR PRODUCTION) ---")
    print("The Django development server is not suitable for production environments due to security and performance limitations.")
    print("For production, it is highly recommended to use a production-ready WSGI server like Gunicorn with a reverse proxy like Nginx.")
    port = os.environ.get('PORT', '8000')
    run_command([sys.executable, 'manage.py', 'runserver', f'0.0.0.0:{port}'], cwd=backend_dir)

    print("\n--- Production Deployment Complete ---")

if __name__ == "__main__":
    deploy_production()
