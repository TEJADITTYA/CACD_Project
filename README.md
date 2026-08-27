# ScamDetect AI

ScamDetect AI is a full-stack message and URL security analysis platform. The
existing HTML frontend calls a Flask API that validates input, applies a
transparent local detector, optionally requests structured analysis from an
OpenAI-compatible provider, persists user-owned analyses in MongoDB, and can
produce integrity-hashed PDF reports.

## Run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Open `analyzer.html` with a static server such as VS Code Live Server, or use
the existing Vite setup. The API is available at `http://127.0.0.1:5000`.

## Configuration

`backend/.env` is ignored by Git. Set `JWT_SECRET` and `MONGODB_URI` for a
deployment. Set `AI_API_KEY` and `AI_API_URL` only when a reviewed,
OpenAI-compatible model endpoint is available. If AI configuration is absent
or unavailable, the response explicitly says `Fallback heuristic analysis`.
No URL is fetched automatically; URL checks are structural unless a reputation
provider is configured.

OTP routes store only a hash for five minutes and cap attempts. A real SMS or
email provider must be connected before production delivery; the API never
returns the OTP.

## API surface

Auth: `POST /api/auth/register`, `/login`, `/logout`, and the four phone/email
OTP routes. Analysis: `POST /api/analyze`, `POST /api/url-check`,
`GET /api/analysis/history`, and `GET /api/analysis/<id>`. Dashboard:
`GET /api/dashboard/stats`. Reports: `POST /api/report/generate`,
`GET /api/report/<id>`, `/pdf`, and `/verify`.

Authenticated endpoints require `Authorization: Bearer <token>`. Anonymous
analysis remains available for the current frontend, while saved history and
reports are user-scoped.

## Security and limitations

Passwords are hashed, requests are size-limited, responses include baseline
security headers, and report previews mask common phone, email, and numeric
secrets. This service does not intercept private messages, bypass platform
security, assert maliciousness without evidence, or provide absolute
protection. Users should avoid submitting unnecessary personal information and
independently verify important messages.

For deployment, use HTTPS, a production WSGI server such as Gunicorn, managed
MongoDB, provider-managed environment variables, strict `CORS_ORIGINS`, and a
rotated high-entropy `JWT_SECRET`. Run `pytest` after adding project tests.