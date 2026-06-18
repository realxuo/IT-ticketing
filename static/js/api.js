// API Client
const API = {
  async request(method, path, data = null, isFormData = false) {
    const opts = {
      method,
      credentials: 'include',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    };
    if (data) opts.body = isFormData ? data : JSON.stringify(data);
    const res = await fetch('/api' + path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  },
  get: (path) => API.request('GET', path),
  post: (path, data) => API.request('POST', path, data),
  patch: (path, data) => API.request('PATCH', path, data),
  postForm: (path, formData) => API.request('POST', path, formData, true),

  // Auth
  login: (email, password) => API.post('/auth/login', { email, password }),
  logout: () => API.post('/auth/logout'),
  register: (name, email, password) => API.post('/auth/register', { name, email, password }),
  me: () => API.get('/auth/me'),

  // Tickets
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return API.get('/tickets' + (qs ? '?' + qs : ''));
  },
  getTicket: (id) => API.get(`/tickets/${id}`),
  createTicket: (formData) => API.postForm('/tickets', formData),
  updateTicket: (id, data) => API.patch(`/tickets/${id}`, data),
  addNote: (id, content, is_internal = false) => API.post(`/tickets/${id}/notes`, { content, is_internal }),

  // Dashboard
  getDashboard: () => API.get('/dashboard'),

  // Technicians
  getTechnicians: () => API.get('/technicians'),
};
