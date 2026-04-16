import { getRandomQuote } from '../utils/checkin';

export function showCheckInModal(
  streak: number, 
  masteredTools: string[], 
  poems: any[], 
  onClose: () => void
) {
  const quote = getRandomQuote(poems);
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
    display: flex; justify-content: center; align-items: center;
    z-index: 5000; animation: fadeIn 0.4s ease;
  `;

  const modal = document.createElement('div');
  modal.className = 'checkin-modal';
  modal.style.cssText = `
    background: rgba(30,32,45, 0.95); color: #ece5d8;
    width: 90%; max-width: 400px;
    padding: 3rem 1.8rem; border-radius: 4px;
    position: relative; box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,193,7,0.1);
    border: 1px solid rgba(255,193,7,0.5);
    text-align: center;
  `;

  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-family: var(--font-serif); font-size: 0.8rem; color: var(--accent); font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 4px; text-transform: uppercase;">
        —— 提瓦特旅途日志 ——
      </div>
      
      <div style="margin-bottom: 2rem; background: rgba(0,0,0,0.3); padding: 1.8rem; border: 1px solid rgba(255,255,255,0.1); position: relative;">
        <!-- 装饰角 -->
        <div style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent);"></div>
        <div style="position: absolute; bottom: -5px; right: -5px; width: 10px; height: 10px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent);"></div>
        
        <div style="font-size: 0.75rem; color: #9496a5; margin-bottom: 1.2rem; font-weight: 600;">${today}</div>
        <div style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 600; line-height: 1.8; color: #fff;">
          ${quote.text}
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: var(--accent); font-weight: 600; margin-top: 1.2rem; opacity: 0.9;">
          ——《${quote.title}》
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 1.2rem;">
        ${['风神瞳', '原石', '纠缠之缘', '神之眼'].map(t => {
          const hasIt = masteredTools.includes(t);
          return `
            <div title="${t}" style="
              width: 54px; height: 54px; 
              display: flex; align-items: center; justify-content: center;
              background: ${hasIt ? 'rgba(255,193,7,0.1)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${hasIt ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
              font-size: 1.8rem; 
              transform: ${hasIt ? 'scale(1.1) rotate(0deg)' : 'scale(0.9) grayscale(1)'};
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
            ">
              ${t === '风神瞳' ? '💠' : t === '原石' ? '✨' : t === '纠缠之缘' ? '🌑' : '💎'}
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 2.2rem; font-weight: 700; color: #fff; font-size: 1rem; letter-spacing: 1px;">
        委托连续达成 <span style="font-size: 2rem; color: var(--accent); margin: 0 4px;">${streak}</span> 天
      </div>
      
      <!-- 右上角浮雕 -->
      <div style="position: absolute; top: -15px; right: -15px; width: 50px; height: 50px; background: var(--bg); border: 1px solid var(--accent); display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 900; transform: rotate(45deg); box-shadow: 0 0 15px rgba(255,193,7,0.3); font-size: 1.2rem; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);">
        <div style="transform: rotate(-45deg);">✨</div>
      </div>
    </div>
    
    <button id="close-checkin" class="btn-eggy-primary" style="margin-top: 2.5rem; width: 100%;">确认收纳 (Confirm)</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#close-checkin')?.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      onClose();
    }, 300);
  });
}
