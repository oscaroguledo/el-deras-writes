# El_Dera's Writes Blog

![El_Dera's Writes Logo](frontend/public/logo.webp)

## Project Description

El_Dera's Writes is a full-stack blog application built with Django (Python) for the backend and React (TypeScript) for the frontend. It features user authentication, article management, commenting, categorization, and tagging. The application is designed to be scalable, maintainable, and easy to deploy.

## Features

### Backend (Django)
- User authentication and authorization (Admin and Normal users)
- Article management (CRUD operations)
- Commenting system
- Categorization and Tagging for articles
- RESTful API with Django REST Framework
- Social media links configuration
- SQLite for development, PostgreSQL for production

### Frontend (React/TypeScript)
- Responsive user interface
- Article listing and detail views
- Comment display and submission
- User-friendly navigation
- Dynamic social media links in the footer
- Detailed meta tags for SEO and social sharing
- WebP image support for optimized performance

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/oscaroguledo/el-deras-writes.git
    cd el-deras-writes
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate
    # Create a user.txt file in the backend directory with admin email on the first line and password on the second line.
    # Example user.txt:
    # admin@example.com
    # adminpassword
    python manage.py create_superuser_from_file # Creates an admin user from user.txt
    cd ..
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run build
    cd ..
    ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd backend
    source venv/bin/activate
    python manage.py runserver
    ```
    The backend will run on `http://localhost:8000`.

2.  **Start the Frontend Development Server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will run on `http://localhost:5173`.

## User Roles and Permissions

The application supports two types of users:

*   **Admin Users:** Have full control over the application, including user management, article creation/editing/deletion (any article), category management, and tag management.
*   **Normal Users:** Can publish their own articles and blogs.

## Social Media Integration

Social media links (WhatsApp, TikTok, Instagram, Facebook) are dynamically fetched from the backend. These can be configured in the Django `settings.py` file.

## Deployment

This application is designed for deployment on platforms like Netlify, Vercel, GitHub Pages, or Cloudflare for the frontend, and any platform supporting Django for the backend (e.g., Heroku, DigitalOcean, AWS). PostgreSQL is recommended for production databases (e.g., Supabase).

### Deployment Script

A `deploy_production.py` script is available in the `backend` directory to automate migration, static file collection, and server startup for production environments.

To use it:
1.  Make it executable: `chmod +x backend/deploy_production.py`
2.  Run it: `./backend/deploy_production.py`

**Note:** The script currently starts the Django development server, which is **NOT RECOMMENDED FOR PRODUCTION**. For production, it's highly advised to use a production-ready WSGI server like Gunicorn with a reverse proxy.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Specify your license here, e.g., MIT License]

## Contact

For any inquiries, please contact [Your Name/Email/GitHub Profile].