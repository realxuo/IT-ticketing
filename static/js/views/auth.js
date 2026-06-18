// Auth View
function renderAuthView() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          ${logoSVG(36)}
          <div>
            <div class="logo-text">HelpDesk</div>
            <div class="logo-sub">IT Support Portal</div>
          </div>
        </div>
        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login">Sign In</button>
          <button class="auth-tab" id="tab-register">Register</button>
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control" id="login-email" placeholder="you@company.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="login-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="login-btn">
            Sign In
          </button>
        </form>

        <form id="register-form" style="display:none">
          <div class="form-group">
            <label class="form-label">Full name</label>
            <input type="text" class="form-control" id="reg-name" placeholder="Jane Smith" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control" id="reg-email" placeholder="you@company.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="reg-password" placeholder="Min. 6 characters" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="register-btn">
            Create Account
          </button>
        </form>

        <div class="auth-demo">
          <div class="auth-demo-title">Demo Accounts</div>
          <div class="auth-demo-item">Admin: <strong>admin@helpdesk.com</strong> / <strong>admin123</strong></div>
          <div class="auth-demo-item">Technician: <strong>alex@helpdesk.com</strong> / <strong>tech123</strong></div>
          <div class="auth-demo-item">User: <strong>sam@company.com</strong> / <strong>user123</strong></div>
        </div>
      </div>
    </div>`;
}

function initAuthView(onLogin) {
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const errBox = document.getElementById('auth-error');

  function showErr(msg) { errBox.textContent = msg; errBox.style.display = 'block'; }
  function hideErr() { errBox.style.display = 'none'; }

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabReg.classList.remove('active');
    loginForm.style.display = 'block'; regForm.style.display = 'none'; hideErr();
  });
  tabReg.addEventListener('click', () => {
    tabReg.classList.add('active'); tabLogin.classList.remove('active');
    regForm.style.display = 'block'; loginForm.style.display = 'none'; hideErr();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); hideErr();
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Signing in…'; btn.disabled = true;
    try {
      const user = await API.login(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
      );
      onLogin(user);
    } catch (err) {
      showErr(err.message);
      btn.textContent = 'Sign In'; btn.disabled = false;
    }
  });

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault(); hideErr();
    const btn = document.getElementById('register-btn');
    btn.textContent = 'Creating…'; btn.disabled = true;
    try {
      const user = await API.register(
        document.getElementById('reg-name').value,
        document.getElementById('reg-email').value,
        document.getElementById('reg-password').value
      );
      onLogin(user);
    } catch (err) {
      showErr(err.message);
      btn.textContent = 'Create Account'; btn.disabled = false;
    }
  });
}
