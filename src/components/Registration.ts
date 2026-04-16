import { getUserStats, saveUserStats } from '../utils/storage';
import { syncRegister, syncLogin, applyCloudData } from '../utils/sync';

/**
 * 提瓦特冒险记录登入 (原注册/登录组件)
 * 采用《原神》契约/祈愿风格
 */
export function renderRegistration(onComplete: () => void) {
  const stats = getUserStats();
  const isRegistered = !!stats.nickname && !!stats.contact;

  const container = document.createElement('div');
  container.className = 'tiyvat-auth-overlay';

  const card = document.createElement('div');
  card.className = 'tiyvat-card';
  card.style.width = '92%';
  card.style.maxWidth = '420px';

  const renderHeader = (icon: string, title: string, subtitle: string, glow: boolean = false) => `
    <div class="tiyvat-header">
      <div class="tiyvat-header-icon ${glow ? 'glow' : ''}">${icon}</div>
      <h2 class="tiyvat-header-title liyue-title">${title}</h2>
      <p class="tiyvat-header-sub liyue-sub">${subtitle}</p>
    </div>
  `;

  const getPinHtml = (className: string, justify: string = 'space-between') => `
    <div style="display: flex; gap: 12px; justify-content: ${justify}; margin-top: 10px;">
      ${[0,1,2,3].map(() => `<input type="tel" maxlength="1" class="${className} tiyvat-pin-base">`).join('')}
    </div>
  `;

  const bindPinEvents = (inputs: NodeListOf<HTMLInputElement>) => {
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => { 
        input.style.borderColor = 'var(--accent)';
        if (input.value && idx < 3) inputs[idx+1].focus(); 
      });
      input.addEventListener('keydown', (e) => { 
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx-1].focus();
          inputs[idx].style.borderColor = 'rgba(255,255,255,0.1)';
        }
      });
    });
  };

  const renderContent = () => {
    try {
      if (!isRegistered) {
        showStep1();
      } else {
        showLogin();
      }
    } catch (err) {
      console.error('Registration Render Error:', err);
      onComplete(); // 降级处理：出错则直接进入主界面
    }
  };

  const showStep1 = () => {
    card.innerHTML = `
      ${renderHeader('💠', '古文背诵 . 岩间契约', 'Contract of the Ancient Stones', true)}

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; text-transform: uppercase; letter-spacing: 1px;">旅者名谓 (Nickname)：</label>
        <input type="text" id="reg-nickname" class="tiyvat-input" placeholder="请输入您的名号..." style="margin-top: 8px;">
      </div>

      <div style="margin-bottom: 2.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; text-transform: uppercase; letter-spacing: 1px;">冒险等阶 (Grade)：</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px;">
          ${[{g:7,label:'初一'},{g:8,label:'初二'},{g:9,label:'初三'}].map(({g,label}) => `<div class="tiyvat-btn-opt" data-grade="${g}">${label}</div>`).join('')}
        </div>
      </div>

      <button id="btn-next" class="btn btn-primary" style="width: 100%;">确认签署 (Confirm & Set Forth)</button>
    `;

    let gradeSelected = 0;
    card.querySelectorAll('.tiyvat-btn-opt').forEach(p => p.addEventListener('click', () => {
      card.querySelectorAll('.tiyvat-btn-opt').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      gradeSelected = parseInt(p.getAttribute('data-grade') || '0');
    }));

    card.querySelector('#btn-next')?.addEventListener('click', () => {
      const nick = (card.querySelector('#reg-nickname') as HTMLInputElement).value.trim();
      if (!nick || !gradeSelected) return alert('请先输入名号并选择冒险等阶');
      showStep2(nick, gradeSelected);
    });
  };

  const showStep2 = (nick: string, grade: number) => {
    card.innerHTML = `
      ${renderHeader('📜', '通关文牒', '这是找回旅途存档的唯一凭证')}

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; letter-spacing: 1px;">契约账号 (UID/Contact)：</label>
        <input type="text" id="reg-contact" class="tiyvat-input" placeholder="手机号/微信号..." style="margin-top: 8px;">
      </div>

      <div style="margin-bottom: 2.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; letter-spacing: 1px;">秘法口令 (4位 PIN)：</label>
        ${getPinHtml('tiyvat-pin')}
      </div>

      <button id="btn-finish" class="btn btn-primary" style="width: 100%;">登入提瓦特 (Launch)</button>
    `;

    const inputs = card.querySelectorAll<HTMLInputElement>('.tiyvat-pin');
    bindPinEvents(inputs);

    card.querySelector('#btn-finish')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#reg-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      if (!contact || pin.length < 4) return alert('契约信息不完整，无法登入');
      
      const btn = card.querySelector('#btn-finish') as HTMLButtonElement;
      btn.innerText = '正在刻录契约...';
      btn.disabled = true;

      const newStats = { ...getUserStats(), nickname: nick, grade, contact, pin };
      syncRegister(newStats).catch(() => {});
      saveUserStats(newStats);
      showCelebration();
    });
  };

  const showLogin = () => {
    card.innerHTML = `
      ${renderHeader('🏮', '归航璃月，旅者', '唤醒如岩石般坚定的契约')}

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <input type="text" id="login-contact" class="tiyvat-input" placeholder="输入您的契约号" style="text-align: center;">
      </div>

      <div style="margin-bottom: 2.5rem;">
        ${getPinHtml('tiyvat-pin-login', 'center')}
      </div>

      <button id="btn-login" class="btn btn-primary" style="width: 100%;">确认契约 (Confirm)</button>
      <div id="go-to-reg" style="margin-top: 1.8rem; color: var(--text-dim); font-size: 0.8rem; cursor: pointer; text-decoration: underline; font-weight: 600; letter-spacing: 1px;">
        初抵璃月的旅者？ (重新签署)
      </div>
    `;

    card.querySelector('#go-to-reg')?.addEventListener('click', () => {
      showStep1();
    });

    const inputs = card.querySelectorAll<HTMLInputElement>('.tiyvat-pin-login');
    bindPinEvents(inputs);

    card.querySelector('#btn-login')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#login-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      
      const btn = card.querySelector('#btn-login') as HTMLButtonElement;
      btn.innerText = '正在溯回岩层...';
      btn.disabled = true;

      const cloudData = await syncLogin(contact, pin);
      if (cloudData) {
        applyCloudData(cloudData.stats, cloudData.progress);
        showCelebration();
      } else {
        if (contact === stats.contact && pin === stats.pin) {
          showCelebration();
        } else {
          card.style.animation = 'eggyShake 0.4s ease'; // 保持震动动画名，或后续统改
          setTimeout(() => card.style.animation = '', 400);
          btn.innerText = '重新登入';
          btn.disabled = false;
          alert('契约号或口令错误');
        }
      }
    });
  };

  const showCelebration = () => {
    card.innerHTML = `
      <div style="padding: 2.5rem 0; text-align: center;">
        <div style="font-size: 6rem; color: #ffb703; filter: drop-shadow(0 0 20px rgba(255,183,3,0.5)); animation: liyueGlow 2s infinite;">💠</div>
        <h2 style="color: var(--text-main); font-size: 2.2rem; font-weight: 700; font-family: var(--font-serif); margin-top: 1rem;">FIXED AS STONE</h2>
        <p style="color: var(--text-dim); font-weight: 500; margin-top: 0.8rem; letter-spacing: 1px;">愿岩王帝君护佑你，${getUserStats().nickname}旅行者</p>
      </div>
    `;
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.6s ease';
        setTimeout(() => { container.remove(); onComplete(); }, 600);
    }, 1500);
  };

  renderContent();
  container.appendChild(card);
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.textContent = `
    .tiyvat-auth-overlay {
      background: radial-gradient(circle at center, #5c0d0d 0%, #1a0505 100%) !important;
    }
    .tiyvat-auth-overlay::before {
      background: url('https://www.transparenttextures.com/patterns/handmade-paper.png');
      opacity: 0.2;
    }
    .tiyvat-card {
      background: rgba(28, 28, 28, 0.95) !important;
      border: 1px solid #ffb70366 !important;
      box-shadow: 0 0 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(255,183,3,0.08) !important;
    }
    /* 璃月云雷纹护角 */
    .tiyvat-card::after {
      width: 30px; height: 30px; border-width: 3px; 
      border-color: #ffb703 #ffb703 transparent transparent !important;
      top: 12px; right: 12px; left: auto;
    }
    .tiyvat-card::before {
      width: 30px; height: 30px; border-width: 3px; 
      border-color: transparent transparent #ffb703 #ffb703 !important;
      bottom: 12px; left: 12px; right: auto;
    }

    .tiyvat-header { margin-bottom: 2.2rem; text-align: center; }
    .tiyvat-header-icon { font-size: 3.5rem; margin-bottom: 0.8rem; }
    .tiyvat-header-icon.glow { filter: drop-shadow(0 0 15px #ffb703); }
    .liyue-title { color: #ffb703 !important; text-shadow: 0 0 10px rgba(255,183,3,0.3); }
    .liyue-sub { color: #d4cfc7 !important; opacity: 0.8; }
    
    .tiyvat-pin-base { 
      width: 3.8rem; height: 3.8rem; text-align: center; 
      background: rgba(0,0,0,0.5); border: 1px solid rgba(255,183,3,0.2); 
      color: #ffb703; font-size: 1.8rem; border-radius: 2px;
    }
    
    .tiyvat-input { border-color: rgba(255,183,3,0.3); background: rgba(0,0,0,0.4); }
    .tiyvat-input:focus { border-color: #ffb703; box-shadow: 0 0 15px rgba(255,183,3,0.2); }

    .btn-primary { background: linear-gradient(135deg, #ffb703, #e6a100) !important; color: #3d1c00 !important; font-weight: 900 !important; }

    .tiyvat-btn-opt { padding: 12px; border: 1px solid rgba(255,183,3,0.1); color: #d4cfc7; border-radius: 2px; background: rgba(0,0,0,0.4); }
    .tiyvat-btn-opt.active { background: rgba(255,183,3,0.15); color: #ffb703; border-color: #ffb703; }
    
    @keyframes liyueGlow {
      0%, 100% { filter: drop-shadow(0 0 8px #ffb703); transform: scale(1); }
      50% { filter: drop-shadow(0 0 20px #ffb703); transform: scale(1.05); }
    }
    @keyframes eggyShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
}
