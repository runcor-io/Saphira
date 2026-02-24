# Saphire AI Backend

FastAPI-based backend for the Saphire AI professional simulation platform.

## Quick Start

### Automatic Setup (Recommended)

Simply run the setup script:

```batch
setup.bat
```

This will:
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Create `.env` file from template
- ✅ Create missing `__init__.py` files
- ✅ Optionally start the server

### Manual Setup

1. **Create virtual environment:**
   ```batch
   python -m venv venv
   venv\Scripts\activate.bat
   ```

2. **Install dependencies:**
   ```batch
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```batch
   copy .env.example .env
   # Edit .env with your actual API keys
   ```

4. **Run database migrations:**
   ```batch
   migrate.bat upgrade
   ```

5. **Start server:**
   ```batch
   start.bat
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `setup.bat` | Full setup (venv, deps, config) |
| `start.bat` | Start development server |
| `start.bat --port 8080` | Start on custom port |
| `migrate.bat` | Database migration manager |
| `migrate.bat upgrade` | Run pending migrations |
| `migrate.bat revision` | Create new migration |
| `test.bat` | Run tests |
| `test.bat --coverage` | Run tests with coverage |

## API Documentation

Once running, access the API documentation at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI entry point
│   ├── config.py        # Settings & env vars
│   ├── database.py      # SQLAlchemy setup
│   ├── auth/            # Authentication
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── routes/          # API routes
├── alembic/             # Database migrations
└── tests/               # Test files
```

## Environment Variables

Required variables in `.env`:

```env
# Security
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost/db

# APIs
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

See `.env.example` for all available options.

## Docker (Optional)

Build and run with Docker:

```batch
docker build -t saphire-backend .
docker run -p 8000:8000 --env-file .env saphire-backend
```

## License

Proprietary - Saphire AI
