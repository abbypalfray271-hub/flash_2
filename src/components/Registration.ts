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

  const renderContent = () => {
    if (!isRegistered) {
      showStep1();
    } else {
      showLogin();
    }
  };

  const showStep1 = () => {
    card.innerHTML = `
      <div style="margin-bottom: 2.2rem; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem; filter: drop-shadow(0 0 10px var(--accent));">✨</div>
        <h2 style="font-family: var(--font-serif); color: var(--text-main); font-size: 1.8rem; margin: 0; font-weight: 700; letter-spacing: 3px;">背诵契约</h2>
        <p style="color: var(--accent); font-weight: bold; font-size: 0.8rem; margin-top: 8px; letter-spacing: 2px; opacity: 0.9; text-transform: uppercase;">Agreement from the Starry Abyss</p>
      </div>

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
      <div style="margin-bottom: 2.2rem; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem;">📜</div>
        <h2 style="font-family: var(--font-serif); color: var(--text-main); font-size: 1.8rem; font-weight: 700;">通关文牒</h2>
        <p style="color: var(--accent); font-weight: bold; font-size: 0.8rem; opacity: 0.9;">这是找回旅途存档的唯一凭证</p>
      </div>

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; letter-spacing: 1px;">契约账号 (UID/Contact)：</label>
        <input type="text" id="reg-contact" class="tiyvat-input" placeholder="手机号/微信号..." style="margin-top: 8px;">
      </div>

      <div style="margin-bottom: 2.5rem; text-align: left;">
        <label style="color: var(--text-dim); font-weight: 600; font-size: 0.8rem; margin-left: 5px; letter-spacing: 1px;">秘法口令 (4位 PIN)：</label>
        <div style="display: flex; gap: 12px; justify-content: space-between; margin-top: 10px;">
          ${[0,1,2,3].map(() => `<input type="tel" maxlength="1" class="tiyvat-pin" style="width: 3.8rem; height: 3.8rem; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: var(--accent); font-size: 1.8rem; border-radius: 4px; outline: none; font-weight: 700;">`).join('')}
        </div>
      </div>

      <button id="btn-finish" class="btn btn-primary" style="width: 100%;">登入提瓦特 (Launch)</button>
    `;

    const inputs = card.querySelectorAll<HTMLInputElement>('.tiyvat-pin');
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

    card.querySelector('#btn-finish')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#reg-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      if (!contact || pin.length < 4) return alert('契约信息不完整，无法登入');
      
      const btn = card.querySelector('#btn-finish') as HTMLButtonElement;
      btn.innerText = '正在缔结契约...';
      btn.disabled = true;

      const newStats = { ...getUserStats(), nickname: nick, grade, contact, pin };
      syncRegister(newStats).catch(() => {});
      saveUserStats(newStats);
      showCelebration();
    });
  };

  const showLogin = () => {
    card.innerHTML = `
      <div style="margin-bottom: 2.2rem; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem;">🌓</div>
        <h2 style="font-family: var(--font-serif); color: var(--text-main); font-size: 1.8rem; font-weight: 700;">欢迎回来，旅者</h2>
        <p style="color: var(--accent); font-weight: bold; font-size: 0.8rem; opacity: 0.9;">唤醒沉睡在星海中的记忆</p>
      </div>

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <input type="text" id="login-contact" class="tiyvat-input" placeholder="输入您的契约号" style="text-align: center;">
      </div>

      <div style="margin-bottom: 2.5rem;">
        <div style="display: flex; gap: 12px; justify-content: center;">
          ${[0,1,2,3].map(() => `<input type="tel" maxlength="1" class="tiyvat-pin-login" style="width: 3.5rem; height: 3.5rem; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: var(--accent); font-size: 1.8rem; border-radius: 4px; outline: none; font-weight: 700;">`).join('')}
        </div>
      </div>

      <button id="btn-login" class="btn btn-primary" style="width: 100%;">开始旅途 (Return)</button>
      <div id="go-to-reg" style="margin-top: 1.8rem; color: var(--text-dim); font-size: 0.8rem; cursor: pointer; text-decoration: underline; font-weight: 600; letter-spacing: 1px;">
        初抵提瓦特的旅者？ (重新注册)
      </div>
    `;

    card.querySelector('#go-to-reg')?.addEventListener('click', () => {
      showStep1();
    });

    const inputs = card.querySelectorAll<HTMLInputElement>('.tiyvat-pin-login');
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => { 
        input.style.borderColor = 'var(--accent)';
        if (input.value && idx < 3) inputs[idx+1].focus(); 
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx-1].focus(); });
    });

    card.querySelector('#btn-login')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#login-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      
      const btn = card.querySelector('#btn-login') as HTMLButtonElement;
      btn.innerText = '正在寻回记忆...';
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
        <div style="font-size: 6rem; color: var(--accent); filter: drop-shadow(0 0 20px var(--accent-soft)); animation: tiyvatGlow 2s infinite;">✨</div>
        <h2 style="color: var(--text-main); font-size: 2.2rem; font-weight: 700; font-family: var(--font-serif); margin-top: 1rem;">MAY YOU WIN</h2>
        <p style="color: var(--text-dim); font-weight: 500; margin-top: 0.8rem; letter-spacing: 1px;">愿风神护佑你，${getUserStats().nickname}旅行者</p>
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
    .tiyvat-btn-opt { padding: 12px; border: 1px solid rgba(255,255,255,0.1); color: var(--text-dim); border-radius: 2px; cursor: pointer; text-align: center; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; background: rgba(0,0,0,0.2); }
    .tiyvat-btn-opt.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
    
    @keyframes eggyShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
}
