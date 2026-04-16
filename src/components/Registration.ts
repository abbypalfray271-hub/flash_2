import { getUserStats, saveUserStats } from '../utils/storage';
import { syncRegister, syncLogin, applyCloudData } from '../utils/sync';

/**
 * 蛋仔岛入驻登记 (原注册/登录组件)
 * 采用《蛋仔派对》潮玩多巴胺风格
 */
export function renderRegistration(onComplete: () => void) {
  const stats = getUserStats();
  const isRegistered = !!stats.nickname && !!stats.contact;

  const container = document.createElement('div');
  container.className = 'eggy-registration-overlay';
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at center, #2a2d44 0%, #111218 100%);
    display: flex; justify-content: center; align-items: center;
    z-index: 4000; animation: fadeIn 0.8s ease; overflow: hidden;
  `;

  // 毛玻璃遮罩，突出中央卡片
  const blurOverlay = document.createElement('div');
  blurOverlay.style.cssText = `
    position: absolute; width: 100%; height: 100%; 
    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
  `;
  container.appendChild(blurOverlay);

  const card = document.createElement('div');
  card.className = 'eggy-card';
  card.style.cssText = `
    width: 92%; max-width: 400px; background: rgba(30, 32, 45, 0.9);
    border: 1px solid rgba(255, 193, 7, 0.5); 
    position: relative; box-shadow: 0 0 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,193,7,0.05);
    padding: 3rem 1.8rem; text-align: center;
    animation: eggyBounceIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1; backdrop-filter: blur(20px);
  `;

  const renderContent = () => {
    if (!isRegistered) {
      showStep1();
    } else {
      showLogin();
    }
  };

  const showStep1 = () => {
    card.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem; filter: sepia(1) saturate(2) hue-rotate(-10deg);">✨</div>
        <h2 style="font-family: var(--font-serif); color: #ece5d8; font-size: 1.8rem; margin: 0; font-weight: 700; letter-spacing: 2px;">背诵契约签署</h2>
        <p style="color: #ffc107; font-weight: bold; font-size: 0.85rem; margin-top: 8px; letter-spacing: 1px; opacity: 0.8;">星辰与深渊，欢迎来到古文提瓦特</p>
      </div>

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <label style="color: #9496a5; font-weight: 600; font-size: 0.85rem; margin-left: 5px; text-transform: uppercase;">背诵名汇 (雅号)：</label>
        <input type="text" id="reg-nickname" placeholder="输入您的名谓..." style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,193,7,0.3); color: #fff; border-radius: 4px; font-size: 1rem; font-weight: 500; outline: none; margin-top: 8px; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 2.5rem; text-align: left;">
        <label style="color: #9496a5; font-weight: 600; font-size: 0.85rem; margin-left: 5px; text-transform: uppercase;">冒险等阶 (AR)：</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px;">
          ${[{g:7,label:'初一'},{g:8,label:'初二'},{g:9,label:'初三'}].map(({g,label}) => `<div class="eggy-btn-opt" data-grade="${g}">${label}</div>`).join('')}
        </div>
      </div>

      <button id="btn-next" class="btn-eggy-primary">签署合约 (Set Forth)</button>
    `;

    let gradeSelected = 0;
    card.querySelectorAll('.eggy-btn-opt').forEach(p => p.addEventListener('click', () => {
      card.querySelectorAll('.eggy-btn-opt').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      gradeSelected = parseInt(p.getAttribute('data-grade') || '0');
    }));

    card.querySelector('#btn-next')?.addEventListener('click', () => {
      const nick = (card.querySelector('#reg-nickname') as HTMLInputElement).value.trim();
      if (!nick || !gradeSelected) return alert('别急，先选个年级填个名！');
      showStep2(nick, gradeSelected);
    });
  };

  const showStep2 = (nick: string, grade: number) => {
    card.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem;">📜</div>
        <h2 style="font-family: var(--font-serif); color: #ece5d8; font-size: 1.8rem; font-weight: 700;">通关文牒</h2>
        <p style="color: #ffc107; font-weight: bold; font-size: 0.85rem; opacity: 0.8;">这是找回旅途存档的唯一凭证</p>
      </div>

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <label style="color: #9496a5; font-weight: 600; font-size: 0.85rem; margin-left: 5px;">通行账号 (UID)：</label>
        <input type="text" id="reg-contact" placeholder="绑定您的账号 (手机号/微信号)..." style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,193,7,0.3); color: #fff; border-radius: 4px; font-size: 1rem; outline: none; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 2.5rem; text-align: left;">
        <label style="color: #9496a5; font-weight: 600; font-size: 0.85rem; margin-left: 5px;">通关秘钥 (4位秘法)：</label>
        <div style="display: flex; gap: 12px; justify-content: space-between; margin-top: 10px;">
          ${[0,1,2,3].map(() => `<input type="tel" maxlength="1" class="eggy-pin" style="width: 3.8rem; height: 3.8rem; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,193,7,0.5); color: #ffc107; font-size: 1.8rem; border-radius: 4px; outline: none; font-weight: 700;">`).join('')}
        </div>
      </div>

      <button id="btn-finish" class="btn-eggy-primary">踏上旅程 (Launch)</button>
    `;

    const inputs = card.querySelectorAll<HTMLInputElement>('.eggy-pin');
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => { if (input.value && idx < 3) inputs[idx+1].focus(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx-1].focus(); });
    });

    card.querySelector('#btn-finish')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#reg-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      if (!contact || pin.length < 4) return alert('密码没填对，蛋仔进不去！');
      
      const btn = card.querySelector('#btn-finish') as HTMLButtonElement;
      btn.innerText = '登岛中...';
      btn.disabled = true;

      const newStats = { ...getUserStats(), nickname: nick, grade, contact, pin };
      
      // 尝试云端同步（静默失败不影响本地注册）
      syncRegister(newStats).catch(() => {});

      saveUserStats(newStats);
      showCelebration();
    });
  };

  const showLogin = () => {
    card.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem;">🌓</div>
        <h2 style="font-family: var(--font-serif); color: #ece5d8; font-size: 1.8rem; font-weight: 700;">欢迎回来，背诵</h2>
        <p style="color: #ffc107; font-weight: bold; font-size: 0.85rem; opacity: 0.8;">输入秘钥寻回旅途记忆</p>
      </div>

      <div style="margin-bottom: 1.5rem; text-align: left;">
        <input type="text" id="login-contact" placeholder="输入通行账号" style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,193,7,0.3); color: #fff; border-radius: 4px; font-size: 1rem; outline: none; box-sizing: border-box; text-align: center;">
      </div>

      <div style="margin-bottom: 2.5rem;">
        <div style="display: flex; gap: 12px; justify-content: center;">
          ${[0,1,2,3].map(() => `<input type="tel" maxlength="1" class="eggy-pin-login" style="width: 3.5rem; height: 3.5rem; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,193,7,0.5); color: #ffc107; font-size: 1.8rem; border-radius: 4px; outline: none; font-weight: 700;">`).join('')}
        </div>
      </div>

      <button id="btn-login" class="btn-eggy-primary">开启记忆 (Return)</button>
      <div id="go-to-reg" style="margin-top: 1.8rem; color: #9496a5; font-size: 0.85rem; cursor: pointer; text-decoration: underline; font-weight: bold;">
        初抵提瓦特的背诵 (重新注册)
      </div>
    `;

    card.querySelector('#go-to-reg')?.addEventListener('click', () => {
      showStep1();
    });

    const inputs = card.querySelectorAll<HTMLInputElement>('.eggy-pin-login');
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => { if (input.value && idx < 3) inputs[idx+1].focus(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx-1].focus(); });
    });

    card.querySelector('#btn-login')?.addEventListener('click', async () => {
      const contact = (card.querySelector('#login-contact') as HTMLInputElement).value.trim();
      const pin = Array.from(inputs).map(i => i.value).join('');
      
      const btn = card.querySelector('#btn-login') as HTMLButtonElement;
      btn.innerText = '正在寻回存档...';
      btn.disabled = true;

      const cloudData = await syncLogin(contact, pin);
      if (cloudData) {
        applyCloudData(cloudData.stats, cloudData.progress);
        showCelebration();
      } else {
        if (contact === stats.contact && pin === stats.pin) {
          showCelebration();
        } else {
          card.style.animation = 'eggyShake 0.4s ease';
          setTimeout(() => card.style.animation = '', 400);
          btn.innerText = '回到派对!';
          btn.disabled = false;
          alert('哎呀，账号或密码对不上！');
        }
      }
    });
  };

  const showCelebration = () => {
    card.innerHTML = `
      <div style="padding-top: 2rem;">
        <div style="font-size: 6rem; color: var(--accent); text-shadow: 0 0 30px rgba(255,193,7,0.5);">✨</div>
        <h2 style="color: #ece5d8; font-size: 2.2rem; font-weight: 700; font-family: var(--font-serif); margin-top: 1rem;">MAY YOU WIN</h2>
        <p style="color: #9496a5; font-weight: 500; margin-top: 0.5rem;">旅途愉快，${getUserStats().nickname}背诵！</p>
      </div>
    `;
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.6s ease';
        setTimeout(() => { container.remove(); onComplete(); }, 600);
    }, 1200);
  };

  renderContent();
  container.appendChild(card);
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.textContent = `
    .eggy-btn-opt { padding: 12px; border: 1px solid rgba(255,193,7,0.3); color: #9496a5; border-radius: 2px; cursor: pointer; text-align: center; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; background: rgba(255,255,255,0.05); }
    .eggy-btn-opt.active { background: var(--accent); color: #000; border-color: var(--accent); clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%); }
    
    .btn-eggy-primary { 
      width: 100%; padding: 1.2rem; background: var(--accent); color: #000; 
      border: none; font-size: 1.2rem; font-weight: 700; 
      cursor: pointer; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.1s;
      clip-path: polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%);
    }
    .btn-eggy-primary:active { transform: translateY(2px) scale(0.98); opacity: 0.9; }
    .btn-eggy-primary:disabled { opacity: 0.5; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes eggyBounceIn { 
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
