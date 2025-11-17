import subprocess
import os
import sys

def run_command(command, cwd=None):
    """Runs a shell command and prints its output."""
    print(f"Running command: {' '.join(command)} in {cwd if cwd else os.getcwd()}")
    sys.stdout.flush() # Flush immediately
    process = subprocess.Popen(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end='')
        sys.stdout.flush() # Flush after each line
    process.wait()
    if process.returncode != 0:
        print(f"Command failed with exit code {process.returncode}")
        sys.stdout.flush() # Flush immediately
        sys.exit(process.returncode)

def deploy_production():
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, '.')

    print("--- Starting Production Deployment ---")
    sys.stdout.flush() # Flush immediately

    # Step 1: Apply Django Migrations
    print("\n--- Applying Django Migrations ---")
    sys.stdout.flush() # Flush immediately
    run_command([sys.executable, 'manage.py', 'makemigrations'], cwd=backend_dir)
    run_command([sys.executable, 'manage.py', 'migrate'], cwd=backend_dir)

    # Step 2: Create Superuser from file
    print("\n--- Creating Superuser from user.txt ---")
    sys.stdout.flush() # Flush immediately
    run_command([sys.executable, 'manage.py', 'create_superuser_from_file'], cwd=backend_dir)
    
    # Step 3: Start Django Development Server (NOT RECOMMENDED FOR PRODUCTION)
    print("\n--- Starting Django Development Server (WARNING: NOT RECOMMENDED FOR PRODUCTION) ---")
    sys.stdout.flush() # Flush immediately
    print("The Django development server is not suitable for production environments due to security and performance limitations.")
    sys.stdout.flush() # Flush immediately
    print("For production, it is highly recommended to use a production-ready WSGI server like Gunicorn with a reverse proxy like Nginx.")
    sys.stdout.flush() # Flush immediately
    port = os.environ.get('PORT', '8000')
    run_command([sys.executable, 'manage.py', 'runserver', f'0.0.0.0:{port}'], cwd=backend_dir)

    print("\n--- Production Deployment Complete ---")
    sys.stdout.flush() # Flush immediately

if __name__ == "__main__":
    deploy_production()
