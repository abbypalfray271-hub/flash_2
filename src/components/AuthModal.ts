import { verifyPassword } from '../utils/auth';

export function showAuthModal(onSuccess: () => void) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(8px);
  `;

  const modal = document.createElement('div');
  modal.className = 'chain-item';
  modal.style.cssText = `
    width: 300px;
    padding: 2rem;
    text-align: center;
    border: 1px solid var(--accent-border);
  `;

  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem; color: var(--accent);">输入管理暗号</h3>
    <input type="password" id="admin-pass" placeholder="请输入暗号..." 
      style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; text-align: center; font-size: 1.2rem; outline: none; margin-bottom: 1.5rem;">
    <div style="display: flex; gap: 0.75rem;">
      <button id="auth-cancel" class="btn btn-secondary" style="flex: 1;">取消</button>
      <button id="auth-confirm" class="btn btn-primary" style="flex: 1;">进入</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const input = modal.querySelector('#admin-pass') as HTMLInputElement;
  input.focus();

  const handleAuth = () => {
    if (verifyPassword(input.value)) {
      document.body.removeChild(overlay);
      onSuccess();
    } else {
      input.style.borderColor = 'red';
      input.value = '';
      input.placeholder = '暗号错误，请重试';
    }
  };

  modal.querySelector('#auth-confirm')!.addEventListener('click', handleAuth);
  modal.querySelector('#auth-cancel')!.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAuth();
  });
}
