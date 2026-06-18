from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import sqlite3
import os
import uuid
import json
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import functools

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'tickets.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_number TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                urgency TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                submitter_id INTEGER NOT NULL,
                assignee_id INTEGER,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                resolved_at TEXT,
                FOREIGN KEY (submitter_id) REFERENCES users(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS ticket_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                author_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                is_internal INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                FOREIGN KEY (author_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                uploaded_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id)
            );
        ''')

        # Seed demo data
        cursor = conn.execute("SELECT COUNT(*) as cnt FROM users")
        if cursor.fetchone()['cnt'] == 0:
            users = [
                ('Admin User', 'admin@helpdesk.com', generate_password_hash('admin123'), 'admin'),
                ('Alex Chen', 'alex@helpdesk.com', generate_password_hash('tech123'), 'technician'),

                ('Sam Rivera', 'sam@company.com', generate_password_hash('user123'), 'user'),
            ]
            conn.executemany(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", users
            )

            tickets_data = [
                ('TKT-001', 'Laptop screen flickering', 'My laptop screen has been flickering for the past 2 days. It happens randomly and makes it hard to work.', 'hardware', 'high', 'in_progress', 3, 2),
                ('TKT-002', 'Cannot access VPN', 'Getting authentication error when trying to connect to company VPN from home.', 'network', 'urgent', 'open', 3, None),
                ('TKT-003', 'Excel not opening files', 'Microsoft Excel crashes immediately when I try to open any .xlsx file.', 'software', 'medium', 'waiting_for_user', 3, None),
                ('TKT-004', 'Password reset needed', 'Locked out of my account after too many failed login attempts.', 'account_access', 'high', 'resolved', 3, 2),
                ('TKT-005', 'Slow internet connection', 'Internet speed is extremely slow, affecting video calls and file uploads.', 'network', 'medium', 'closed', 3, None),
                ('TKT-006', 'Printer not detected', 'The office printer on Floor 3 is not showing up on my computer.', 'hardware', 'low', 'open', 3, None),
                ('TKT-007', 'Email not syncing', 'Outlook is not syncing new emails. Last sync was 6 hours ago.', 'software', 'high', 'in_progress', 3, 2),
            ]

            for t in tickets_data:
                conn.execute(
                    '''INSERT INTO tickets 
                       (ticket_number, title, description, category, urgency, status, submitter_id, assignee_id, 
                        created_at, updated_at, resolved_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?,
                        datetime('now', '-' || abs(random() % 10) || ' days'),
                        datetime('now', '-' || abs(random() % 3) || ' days'),
                        CASE WHEN ? IN ('resolved','closed') THEN datetime('now', '-1 day') ELSE NULL END)''',
                    (*t, t[6])
                )

            notes = [
                (1, 2, "Checked the display drivers — they're outdated. Updating now.", 1),
                (1, 2, "Driver update didn't resolve the issue. Will need to inspect hardware in person.", 1),
                (4, 2, "Account unlocked and temporary password sent to user's phone.", 1),
                (4, 2, "User confirmed access restored. Ticket resolved.", 0),
            ]
            conn.executemany(
                "INSERT INTO ticket_notes (ticket_id, author_id, content, is_internal) VALUES (?, ?, ?, ?)", notes
            )

        conn.commit()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated


def technician_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        if session.get('role') not in ('technician', 'admin'):
            return jsonify({'error': 'Technician access required'}), 403
        return f(*args, **kwargs)
    return decorated


def row_to_dict(row):
    return dict(row) if row else None


# ── AUTH ──────────────────────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    session['user_id'] = user['id']
    session['role'] = user['role']
    session['name'] = user['name']
    return jsonify({
        'id': user['id'], 'name': user['name'],
        'email': user['email'], 'role': user['role']
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@app.route('/api/auth/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'user': None})
    return jsonify({
        'id': session['user_id'],
        'name': session['name'],
        'role': session['role']
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
                (name, email, generate_password_hash(password))
            )
            conn.commit()
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        session['user_id'] = user['id']
        session['role'] = 'user'
        session['name'] = user['name']
        return jsonify({'id': user['id'], 'name': user['name'], 'email': email, 'role': 'user'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 409


# ── TICKETS ───────────────────────────────────────────────────────────────────

@app.route('/api/tickets', methods=['GET'])
@login_required
def get_tickets():
    status_filter = request.args.get('status')
    category_filter = request.args.get('category')
    urgency_filter = request.args.get('urgency')
    search = request.args.get('search', '').strip()

    query = '''
        SELECT t.*, 
               u1.name as submitter_name, u1.email as submitter_email,
               u2.name as assignee_name
        FROM tickets t
        JOIN users u1 ON t.submitter_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        WHERE 1=1
    '''
    params = []

    if session.get('role') == 'user':
        query += " AND t.submitter_id = ?"
        params.append(session['user_id'])

    assignee_filter = request.args.get('assignee_id')
    if assignee_filter:
        query += " AND t.assignee_id = ?"
        params.append(int(assignee_filter))

    unassigned_filter = request.args.get('unassigned')
    if unassigned_filter:
        query += " AND t.assignee_id IS NULL"

    if status_filter:
        query += " AND t.status = ?"
        params.append(status_filter)
    if category_filter:
        query += " AND t.category = ?"
        params.append(category_filter)
    if urgency_filter:
        query += " AND t.urgency = ?"
        params.append(urgency_filter)
    if search:
        query += " AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)"
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])

    query += " ORDER BY t.created_at DESC"

    with get_db() as conn:
        tickets = [row_to_dict(r) for r in conn.execute(query, params).fetchall()]

    return jsonify(tickets)


@app.route('/api/tickets', methods=['POST'])
@login_required
def create_ticket():
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    category = request.form.get('category', '')
    urgency = request.form.get('urgency', 'medium')

    if not title or not description or not category:
        return jsonify({'error': 'Title, description, and category are required'}), 400

    valid_categories = ['hardware', 'software', 'network', 'account_access']
    valid_urgencies = ['low', 'medium', 'high', 'urgent']
    if category not in valid_categories:
        return jsonify({'error': 'Invalid category'}), 400
    if urgency not in valid_urgencies:
        return jsonify({'error': 'Invalid urgency'}), 400

    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) as cnt FROM tickets").fetchone()['cnt']
        ticket_number = f"TKT-{count + 1:04d}"

        conn.execute(
            '''INSERT INTO tickets (ticket_number, title, description, category, urgency, submitter_id)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (ticket_number, title, description, category, urgency, session['user_id'])
        )
        ticket_id = conn.execute("SELECT last_insert_rowid() as id").fetchone()['id']

        # Handle file uploads
        files = request.files.getlist('attachments')
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                original_name = secure_filename(file.filename)
                ext = original_name.rsplit('.', 1)[1].lower()
                stored_name = f"{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], stored_name))
                conn.execute(
                    "INSERT INTO ticket_attachments (ticket_id, filename, original_name) VALUES (?, ?, ?)",
                    (ticket_id, stored_name, original_name)
                )

        conn.commit()
        ticket = conn.execute(
            '''SELECT t.*, u1.name as submitter_name FROM tickets t
               JOIN users u1 ON t.submitter_id = u1.id WHERE t.id = ?''', (ticket_id,)
        ).fetchone()

    return jsonify(row_to_dict(ticket)), 201


@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
    with get_db() as conn:
        ticket = conn.execute(
            '''SELECT t.*, u1.name as submitter_name, u1.email as submitter_email,
                      u2.name as assignee_name
               FROM tickets t
               JOIN users u1 ON t.submitter_id = u1.id
               LEFT JOIN users u2 ON t.assignee_id = u2.id
               WHERE t.id = ?''', (ticket_id,)
        ).fetchone()

        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404

        if session.get('role') == 'user' and ticket['submitter_id'] != session['user_id']:
            return jsonify({'error': 'Access denied'}), 403

        notes_query = '''
            SELECT n.*, u.name as author_name, u.role as author_role
            FROM ticket_notes n JOIN users u ON n.author_id = u.id
            WHERE n.ticket_id = ?
        '''
        if session.get('role') == 'user':
            notes_query += " AND n.is_internal = 0"
        notes_query += " ORDER BY n.created_at ASC"

        notes = [row_to_dict(r) for r in conn.execute(notes_query, (ticket_id,)).fetchall()]
        attachments = [row_to_dict(r) for r in conn.execute(
            "SELECT * FROM ticket_attachments WHERE ticket_id = ?", (ticket_id,)
        ).fetchall()]

    result = row_to_dict(ticket)
    result['notes'] = notes
    result['attachments'] = attachments
    return jsonify(result)


@app.route('/api/tickets/<int:ticket_id>', methods=['PATCH'])
@technician_required
def update_ticket(ticket_id):
    data = request.get_json()

    with get_db() as conn:
        ticket = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404

        updates = {}
        if 'status' in data:
            valid_statuses = ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed']
            if data['status'] not in valid_statuses:
                return jsonify({'error': 'Invalid status'}), 400
            updates['status'] = data['status']
            if data['status'] in ('resolved', 'closed') and not ticket['resolved_at']:
                updates['resolved_at'] = datetime.utcnow().isoformat()

        if 'assignee_id' in data:
            if data['assignee_id']:
                tech = conn.execute(
                    "SELECT id FROM users WHERE id = ? AND role IN ('technician','admin')",
                    (data['assignee_id'],)
                ).fetchone()
                if not tech:
                    return jsonify({'error': 'Invalid technician'}), 400
            updates['assignee_id'] = data['assignee_id']

        if 'urgency' in data:
            updates['urgency'] = data['urgency']

        if updates:
            updates['updated_at'] = datetime.utcnow().isoformat()
            set_clause = ', '.join(f"{k} = ?" for k in updates)
            conn.execute(
                f"UPDATE tickets SET {set_clause} WHERE id = ?",
                [*updates.values(), ticket_id]
            )
            conn.commit()

        updated = conn.execute(
            '''SELECT t.*, u1.name as submitter_name, u2.name as assignee_name
               FROM tickets t JOIN users u1 ON t.submitter_id = u1.id
               LEFT JOIN users u2 ON t.assignee_id = u2.id
               WHERE t.id = ?''', (ticket_id,)
        ).fetchone()

    return jsonify(row_to_dict(updated))


@app.route('/api/tickets/<int:ticket_id>/notes', methods=['POST'])
@login_required
def add_note(ticket_id):
    data = request.get_json()
    content = data.get('content', '').strip()
    is_internal = data.get('is_internal', False)

    if not content:
        return jsonify({'error': 'Note content required'}), 400

    if is_internal and session.get('role') == 'user':
        is_internal = False

    with get_db() as conn:
        ticket = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        if session.get('role') == 'user' and ticket['submitter_id'] != session['user_id']:
            return jsonify({'error': 'Access denied'}), 403

        conn.execute(
            "INSERT INTO ticket_notes (ticket_id, author_id, content, is_internal) VALUES (?, ?, ?, ?)",
            (ticket_id, session['user_id'], content, 1 if is_internal else 0)
        )
        conn.execute(
            "UPDATE tickets SET updated_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), ticket_id)
        )
        conn.commit()

        note = conn.execute(
            '''SELECT n.*, u.name as author_name, u.role as author_role
               FROM ticket_notes n JOIN users u ON n.author_id = u.id
               WHERE n.ticket_id = ? ORDER BY n.created_at DESC LIMIT 1''', (ticket_id,)
        ).fetchone()

    return jsonify(row_to_dict(note)), 201


# ── DASHBOARD ─────────────────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@technician_required
def dashboard():
    is_admin = session.get('role') == 'admin'
    user_id = session.get('user_id')

    with get_db() as conn:
        # Scope queries to own tickets for technicians
        scope = "" if is_admin else f" AND t.assignee_id = {user_id}"
        scope_no_alias = "" if is_admin else f" AND assignee_id = {user_id}"

        status_counts = {
            r['status']: r['count']
            for r in conn.execute(
                f"SELECT status, COUNT(*) as count FROM tickets t WHERE 1=1{scope_no_alias} GROUP BY status"
            ).fetchall()
        }

        category_counts = [
            {'category': r['category'], 'count': r['count']}
            for r in conn.execute(
                f"SELECT t.category, COUNT(*) as count FROM tickets t WHERE 1=1{scope} GROUP BY t.category ORDER BY count DESC"
            ).fetchall()
        ]

        urgency_counts = [
            {'urgency': r['urgency'], 'count': r['count']}
            for r in conn.execute(
                f"SELECT t.urgency, COUNT(*) as count FROM tickets t WHERE 1=1{scope} GROUP BY t.urgency"
            ).fetchall()
        ]

        # Average resolution time (in hours)
        avg_row = conn.execute(
            f'''SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
               FROM tickets t WHERE resolved_at IS NOT NULL{scope}'''
        ).fetchone()
        avg_hours = round(avg_row['avg_hours'] or 0, 1)

        # Workload: admin sees all technicians, technician sees only themselves
        if is_admin:
            workload = [
                {'name': r['name'], 'open_tickets': r['open_tickets'], 'total_tickets': r['total_tickets']}
                for r in conn.execute(
                    '''SELECT u.name,
                              SUM(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as open_tickets,
                              COUNT(t.id) as total_tickets
                       FROM users u
                       LEFT JOIN tickets t ON t.assignee_id = u.id
                       WHERE u.role IN ('technician','admin')
                       GROUP BY u.id, u.name
                       ORDER BY open_tickets DESC'''
                ).fetchall()
            ]
        else:
            workload = [
                {'name': r['name'], 'open_tickets': r['open_tickets'], 'total_tickets': r['total_tickets']}
                for r in conn.execute(
                    '''SELECT u.name,
                              SUM(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as open_tickets,
                              COUNT(t.id) as total_tickets
                       FROM users u
                       LEFT JOIN tickets t ON t.assignee_id = u.id
                       WHERE u.id = ?
                       GROUP BY u.id, u.name''', (user_id,)
                ).fetchall()
            ]

        # Recent activity (last 7 days)
        daily_counts = [
            {'date': r['date'], 'count': r['count']}
            for r in conn.execute(
                f'''SELECT date(t.created_at) as date, COUNT(*) as count
                   FROM tickets t
                   WHERE t.created_at >= date('now', '-7 days'){scope}
                   GROUP BY date(t.created_at)
                   ORDER BY date ASC'''
            ).fetchall()
        ]

        total = conn.execute(f"SELECT COUNT(*) as cnt FROM tickets t WHERE 1=1{scope}").fetchone()['cnt']
        open_count = status_counts.get('open', 0)

    return jsonify({
        'status_counts': status_counts,
        'category_counts': category_counts,
        'urgency_counts': urgency_counts,
        'avg_resolution_hours': avg_hours,
        'workload': workload,
        'daily_counts': daily_counts,
        'total_tickets': total,
        'open_tickets': open_count,
        'is_admin': is_admin,
    })


# ── TECHNICIANS ───────────────────────────────────────────────────────────────

@app.route('/api/technicians', methods=['GET'])
@technician_required
def get_technicians():
    with get_db() as conn:
        techs = [row_to_dict(r) for r in conn.execute(
            "SELECT id, name, email, role FROM users WHERE role IN ('technician','admin') ORDER BY name"
        ).fetchall()]
    return jsonify(techs)


# ── UPLOADS ───────────────────────────────────────────────────────────────────

@app.route('/api/uploads/<filename>')
@login_required
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ── SPA ───────────────────────────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    if path.startswith('api/') or path.startswith('static/'):
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)