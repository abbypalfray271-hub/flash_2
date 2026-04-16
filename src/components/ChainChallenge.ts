import type { Poem } from '../types';
import { navigate } from '../utils/router';
import { markSentenceMastered } from '../utils/storage';
import { playClip } from './AudioPlayer';
import { getRandomReward, type Reward } from '../utils/rewards';

export function renderChainChallenge(poem: Poem) {
  let currentIndex = 0;
  let masteredCount = 0;
  
  const container = document.createElement('div');
  container.className = 'chain-view';

  const header = document.createElement('header');
  header.className = 'app-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <button id="back-btn" class="btn" style="width: auto; padding: 0.5rem 1rem; background: transparent; color: #ff5f5f; border:none; clip-path:none;">←</button>
    <div style="text-align: center;">
      <h2 style="font-size: 1.2rem; font-family: var(--font-serif); color: var(--accent);">背诵挑战</h2>
      <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Recitation Challenge · ${poem.title}</div>
    </div>
    <div style="width: 40px;"></div>
  `;
  container.appendChild(header);

  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '1.5rem';
  container.appendChild(content);

  const prevSentenceBox = document.createElement('div');
  prevSentenceBox.className = 'chain-item';
  prevSentenceBox.style.background = 'rgba(255,255,255,0.03)';
  
  const currentSentenceBox = document.createElement('div');
  currentSentenceBox.className = 'chain-item';
  currentSentenceBox.style.border = '1px solid var(--accent-border)';
  
  content.appendChild(prevSentenceBox);
  content.appendChild(currentSentenceBox);

  const controls = document.createElement('div');
  controls.className = 'controls hidden';
  
  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  
  const failBtn = document.createElement('button');
  failBtn.className = 'btn btn-secondary';
  failBtn.style.color = '#ff5f5f';
  failBtn.textContent = '记不清 (跳过)';
  
  const successBtn = document.createElement('button');
  successBtn.className = 'btn btn-primary';
  successBtn.textContent = '背对了 (确认)';

  btnGroup.appendChild(failBtn);
  btnGroup.appendChild(successBtn);
  controls.appendChild(btnGroup);
  container.appendChild(controls);

  const updateChallenge = () => {
    if (currentIndex >= poem.sentences.length) {
      showResult();
      return;
    }

    const prevSentence = currentIndex > 0 ? poem.sentences[currentIndex - 1] : null;
    const currentSentence = poem.sentences[currentIndex];

    prevSentenceBox.innerHTML = `
      <div class="chain-label" style="color: var(--text-dim); opacity: 0.6;">上一句</div>
      <div class="guwen-text chain-text" style="font-size: 1.2rem; opacity: 0.8;">${prevSentence ? prevSentence.text : '（首句开始）'}</div>
    `;

    currentSentenceBox.innerHTML = `
      <div id="mask" class="chain-mask" style="border: 1px dashed var(--accent-border); color: var(--accent); opacity: 0.8; padding: 1rem;">显示下一句</div>
    `;

    controls.classList.add('hidden');
    
    const maskEl = currentSentenceBox.querySelector('#mask') as HTMLElement;
    maskEl?.addEventListener('click', () => {
      maskEl.classList.add('revealed');
      maskEl.innerHTML = `<div class="guwen-text chain-text clickable" style="cursor: pointer; color: #fff;">${currentSentence.text}</div>`;
      controls.classList.remove('hidden');

      if (currentSentence.audioFile) {
        playClip(currentSentence.audioFile);
      }

      maskEl.querySelector('.chain-text')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentSentence.audioFile) playClip(currentSentence.audioFile);
      });
    });
  };

  const showResult = () => {
    const accuracy = Math.round((masteredCount / poem.sentences.length) * 100);
    const reward = getRandomReward(accuracy);
    
    // 注入结算特定样式
    const styleId = 'liyue-result-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .reward-card {
          background: rgba(28, 28, 28, 0.95);
          border: 1px solid #ffb70366;
          border-radius: 4px;
          padding: 2rem 1.5rem;
          position: relative;
          box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,183,3,0.05);
          animation: rewardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }
        .reward-card::after { content: ""; position: absolute; top: 8px; left: 8px; width: 12px; height: 12px; border-top: 2px solid #ffb703; border-left: 2px solid #ffb703; }
        .reward-card::before { content: ""; position: absolute; bottom: 8px; right: 8px; width: 12px; height: 12px; border-bottom: 2px solid #ffb703; border-right: 2px solid #ffb703; }
        
        .reward-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 15px #ffb703);
          animation: rewardGlow 2s infinite ease-in-out;
        }
        .reward-name { color: #ffb703; font-weight: 900; font-size: 1.4rem; margin-bottom: 1.5rem; letter-spacing: 2px; }
        .reward-quote { font-style: italic; color: #ece5d8; line-height: 1.6; margin-bottom: 1rem; font-family: var(--font-serif); }
        .reward-character { color: var(--text-dim); font-size: 0.8rem; text-align: right; margin-bottom: 2rem; }
        
        @keyframes rewardPop { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes rewardGlow { 0%, 100% { filter: drop-shadow(0 0 10px #ffb703); transform: scale(1); } 50% { filter: drop-shadow(0 0 25px #ffb703); transform: scale(1.1); } }
      `;
      document.head.appendChild(style);
    }

    content.innerHTML = `
      <div class="reward-card">
        <div class="reward-icon">${reward.icon}</div>
        <div class="reward-name">${reward.name}</div>
        
        <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 2px; margin-bottom: 2rem; border-left: 3px solid #ffb703;">
          <div class="reward-quote">“${reward.quote}”</div>
          <div class="reward-character">—— ${reward.character}</div>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 2rem; letter-spacing: 1px;">
          本次背诵正确率：<span style="color: #ffb703; font-weight: bold;">${accuracy}%</span><br>
          (背对 ${masteredCount} / 合计 ${poem.sentences.length})
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <button id="restart-btn" class="btn btn-primary">再次挑战 (Restart)</button>
          <button id="finish-btn" class="btn btn-secondary" style="border-color: rgba(255,183,3,0.3)">收下奖励并返回 (Receive)</button>
        </div>
      </div>
    `;
    controls.classList.add('hidden');
    
    content.querySelector('#restart-btn')?.addEventListener('click', () => {
      currentIndex = 0;
      masteredCount = 0;
      content.innerHTML = '';
      content.appendChild(prevSentenceBox);
      content.appendChild(currentSentenceBox);
      updateChallenge();
    });
    
    content.querySelector('#finish-btn')?.addEventListener('click', () => navigate('home'));
  };

  successBtn.addEventListener('click', () => {
    markSentenceMastered(poem.id, poem.sentences[currentIndex].id);
    masteredCount++;
    currentIndex++;
    updateChallenge();
  });


  failBtn.addEventListener('click', () => {
    currentIndex++;
    updateChallenge();
  });

  header.querySelector('#back-btn')?.addEventListener('click', () => navigate('flashcard', poem.id));

  updateChallenge();
  return container;
}
