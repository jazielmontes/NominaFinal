const USERS = [
  { user: 'admin', pass: '1234' },
  { user: 'demo', pass: 'demo' }
];

document.getElementById('btnLogin').addEventListener('click', () => {
  const u = document.getElementById('usuario').value.trim();
  const p = document.getElementById('password').value.trim();

  const ok = USERS.find(x => x.user === u && x.pass === p);

  if (ok) {
    localStorage.setItem('auth', 'true');
    window.location.href = 'index.html';
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
});
