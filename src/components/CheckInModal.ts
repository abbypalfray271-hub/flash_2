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
  overlay.className = 'tiyvat-auth-overlay';
  overlay.style.background = 'rgba(0,0,0,0.85)'; // 弹窗模式下略微加深背景

  const modal = document.createElement('div');
  modal.className = 'tiyvat-card';
  modal.style.width = '90%';
  modal.style.maxWidth = '420px';
  modal.style.textAlign = 'center';

  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-family: var(--font-serif); font-size: 0.8rem; color: var(--accent); font-weight: 700; margin-bottom: 0.8rem; letter-spacing: 4px; text-transform: uppercase;">
        —— 提瓦特旅途日志 ——
      </div>
      
      <div style="margin-bottom: 2rem; background: rgba(0,0,0,0.3); padding: 2rem 1.5rem; border: 1px solid rgba(255,255,255,0.05); position: relative;">
        <!-- 装饰角 -->
        <div style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent);"></div>
        <div style="position: absolute; bottom: -5px; right: -5px; width: 10px; height: 10px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent);"></div>
        
        <div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 1.2rem; font-weight: 600; opacity: 0.8;">${today}</div>
        <div style="font-family: var(--font-serif); font-size: 1.4rem; font-weight: 600; line-height: 1.8; color: #fff; letter-spacing: 1px;">
          ${quote.text}
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: var(--accent); font-weight: 600; margin-top: 1.5rem; opacity: 0.9; letter-spacing: 1px;">
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
              background: ${hasIt ? 'var(--accent-soft)' : 'rgba(255,255,255,0.03)'};
              border: 1px solid ${hasIt ? 'var(--accent)' : 'rgba(255,255,255,0.05)'};
              font-size: 1.8rem; 
              transform: ${hasIt ? 'scale(1.1)' : 'scale(0.9) grayscale(1)'};
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
            ">
              ${t === '风神瞳' ? '💠' : t === '原石' ? '✨' : t === '纠缠之缘' ? '🌑' : '💎'}
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 2.2rem; font-weight: 800; color: #fff; font-size: 1rem; letter-spacing: 2px;">
        委托连续达成 <span style="font-size: 2.2rem; color: var(--accent); margin: 0 6px; font-family: var(--font-serif);">${streak}</span> 天
      </div>
    </div>
    
    <button id="close-checkin" class="btn btn-primary" style="margin-top: 2.5rem; width: 100%;">确认收纳 (Confirm)</button>
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
