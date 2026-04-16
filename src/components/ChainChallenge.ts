import type { Poem } from '../types';
import { navigate } from '../utils/router';
import { markSentenceMastered } from '../utils/storage';
import { playClip } from './AudioPlayer';

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
    const starCount = accuracy >= 100 ? 3 : (accuracy >= 70 ? 2 : 1);
    
    content.innerHTML = `
      <div class="chain-item" style="text-align: center; padding: 3rem 1.5rem; background: rgba(30,32,45, 0.9); border: 1px solid var(--accent);">
        <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent);">
          ${'⭐'.repeat(starCount)}
        </div>
        <h2 style="color: var(--accent); font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 0.5rem; letter-spacing: 2px;">背诵完毕</h2>
        <div style="font-size: 1rem; margin-bottom: 1.5rem; color: var(--text-main);">
          评级：<span style="color: var(--accent); font-weight: bold;">${accuracy >= 100 ? '完美' : '良好'}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 2.5rem; letter-spacing: 1px;">
          本次共背对 ${masteredCount} 处 / 合计 ${poem.sentences.length} 处
        </p>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <button id="restart-btn" class="btn btn-primary">再次尝试 (Restart)</button>
          <button id="finish-btn" class="btn btn-secondary">返回列表 (Back)</button>
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
