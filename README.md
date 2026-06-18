# HelpDesk — IT Ticketing System

A full-stack IT support ticketing system built with **Flask + SQLite** (backend) and **vanilla JavaScript** (frontend).

## Features

### User Portal
- Submit support tickets with title, description, category, and urgency
- Upload screenshots and attachments (PNG, JPG, GIF, PDF)
- Track ticket status in real time
- Add notes and follow up on existing tickets

### Technician Portal
- View all tickets with filtering by status, category, urgency
- Assign tickets to technicians
- Update ticket status: Open → In Progress → Waiting for User → Resolved → Closed
- Add internal notes (hidden from users) and public updates

### Dashboard (Technicians)
- Open / in-progress / resolved ticket counts
- Average resolution time
- Tickets by category (bar chart)
- Status breakdown (donut chart)
- Technician workload visualization
- Activity trend (last 7 days)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, Flask 3, SQLite |
| Frontend | Vanilla JS (ES2020), CSS custom properties |
| Auth | Session-based (Flask sessions) |
| File uploads | Werkzeug secure_filename |

## Quick Start

### Prerequisites
- Python 3.10+
- pip

### Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/it-ticketing.git
cd it-ticketing

pip install -r requirements.txt

python app.py
```

Open `http://localhost:5000` in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@helpdesk.com | admin123 |
| Technician | alex@helpdesk.com | tech123 |
| Technician | jordan@helpdesk.com | tech123 |
| User | sam@company.com | user123 |
| User | taylor@company.com | user123 |

## Project Structure

```
it-ticketing/
├── app.py                  # Flask application & API routes
├── requirements.txt
├── index.html              # SPA shell
├── instance/
│   └── tickets.db          # SQLite database (auto-created)
└── static/
    ├── css/
    │   └── main.css
    ├── js/
    │   ├── api.js           # API client
    │   ├── components.js    # Shared UI helpers
    │   ├── app.js           # Router
    │   └── views/
    │       ├── auth.js
    │       ├── tickets.js
    │       ├── ticket-detail.js
    │       ├── dashboard.js
    │       └── tech-tickets.js
    └── uploads/             # Uploaded attachments
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| POST | /api/auth/register | Register new user |
| GET | /api/auth/me | Current session |
| GET | /api/tickets | List tickets |
| POST | /api/tickets | Create ticket |
| GET | /api/tickets/:id | Get ticket detail |
| PATCH | /api/tickets/:id | Update status/assignee |
| POST | /api/tickets/:id/notes | Add note |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/technicians | List technicians |

## Deployment

For production, set a strong secret key and use a production WSGI server:

```bash
export SECRET_KEY="your-strong-secret-key"
pip install gunicorn
gunicorn app:app -w 4 -b 0.0.0.0:5000
```

## License

MIT
