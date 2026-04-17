import type { Poem, Keyword } from '../types';
import { navigate } from '../utils/router';
import { playClip, toggleClip, playPlaylist, isPlaylistPlaying, stopAudio } from './AudioPlayer';

/**
 * 将原文中的关键词高亮标注（琥珀色下划线），点击弹出释义
 * 采用“片段拆分法”防止关键词重叠导致 HTML 标签被破坏
 */
function highlightKeywords(text: string, keywords: Keyword[]): string {
  if (!keywords || keywords.length === 0) return text;

  // 1. 找出所有匹配项及其位置
  interface Match {
    start: number;
    end: number;
    kw: Keyword;
  }
  const matches: Match[] = [];

  // 排序：优先处理长词，防止短词切分了长词
  const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length);

  for (const kw of sortedKeywords) {
    const escaped = kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    let m;
    while ((m = regex.exec(text)) !== null) {
      // 检查是否有重叠
      const isOverlapping = matches.some(prev => 
        (m!.index >= prev.start && m!.index < prev.end) || 
        (m!.index + kw.word.length > prev.start && m!.index + kw.word.length <= prev.end)
      );
      if (!isOverlapping) {
        matches.push({
          start: m.index,
          end: m.index + kw.word.length,
          kw: kw
        });
        break; // 找到第一个非重叠匹配项后立即跳出，实现“一词一显”
      }
    }
  }

  // 2. 按起始位置排序
  matches.sort((a, b) => a.start - b.start);

  // 3. 构造最终 HTML
  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    // 拼接匹配项之前的普通文本
    result += text.substring(lastIndex, match.start);
    
    // 拼接高亮标签
    const tooltip = match.kw.pinyin ? `${match.kw.pinyin}：${match.kw.meaning}` : match.kw.meaning;
    const escapedTip = tooltip.replace(/"/g, '&quot;');
    result += `<span class="keyword-highlight" data-tip="${escapedTip}">${match.kw.word}</span>`;
    
    lastIndex = match.end;
  }

  // 拼接最后剩余的文本
  result += text.substring(lastIndex);
  
  return result;
}

/**
 * 显示关键词释义气泡
 */
function showTooltip(target: HTMLElement) {
  // 清除已有气泡
  const clearTooltips = () => {
    document.querySelectorAll('.kw-tooltip').forEach(el => el.remove());
    document.removeEventListener('click', clearTooltips);
  };
  
  clearTooltips();
  
  const tip = target.dataset.tip;
  if (!tip) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'kw-tooltip';
  tooltip.textContent = tip;
  
  document.body.appendChild(tooltip);
  
  const rect = target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.bottom + 10 + window.scrollY}px`;
  
  // 1. 点击屏幕任意处立即清除 (延迟绑定防止当前点击触发清除)
  setTimeout(() => {
    document.addEventListener('click', clearTooltips, { once: true });
  }, 10);

  // 2. 3秒后自动消失 (如果还没被点击清除)
  setTimeout(() => {
    if (tooltip.parentElement) {
       tooltip.remove();
       document.removeEventListener('click', clearTooltips);
    }
  }, 3000);
}

export function renderFlashCard(poem: Poem) {
  let currentIndex = 0;
  
  const container = document.createElement('div');
  container.className = 'flashcard-view';

  const header = document.createElement('header');
  header.className = 'app-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '1.5rem';
  header.innerHTML = `
    <button id="back-btn" class="btn" style="width: auto; padding: 0.5rem 1rem; background: transparent; color: var(--text-dim); border:none; clip-path:none;">←</button>
    <div style="text-align: center;">
      <h2 style="font-size: 1.2rem; font-family: var(--font-serif); color: var(--accent);">${poem.title}</h2>
      <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">${poem.author}</div>
    </div>
    <div id="mode-switch" style="font-size: 0.75rem; color: var(--accent); cursor: pointer; border: 1px solid var(--accent-border); padding: 4px 10px; border-radius: 2px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">背诵挑战 →</div>
  `;
  container.appendChild(header);

  const cardContainer = document.createElement('div');
  cardContainer.className = 'card-container';
  
  const cardInner = document.createElement('div');
  cardInner.className = 'card-inner';
  
  const cardFront = document.createElement('div');
  cardFront.className = 'card-face card-front';
  
  const cardBack = document.createElement('div');
  cardBack.className = 'card-face card-back';
  
  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  cardContainer.appendChild(cardInner);
  container.appendChild(cardContainer);

  // 预热逻辑：计算每个关键词在全文中的首次出现“话号”（Sentence Index）
  // 确保“全篇去重”逻辑在单句翻页模式下也能生效
  const keywordFirstOccurrence = new Map<string, number>();
  const allKeywords = poem.keywords || [];
  poem.sentences.forEach((s, sIdx) => {
    allKeywords.forEach(kw => {
      if (!keywordFirstOccurrence.has(kw.word) && s.text.includes(kw.word)) {
        keywordFirstOccurrence.set(kw.word, sIdx);
      }
    });
  });

  // 获取当前句子相关的关键词（仅包含在本句中首次出现的词）
  const getRelevantKeywords = (sentenceText: string, sentenceIndex: number): Keyword[] => {
    if (!poem.keywords) return [];
    return poem.keywords.filter(kw => 
      sentenceText.includes(kw.word) && 
      keywordFirstOccurrence.get(kw.word) === sentenceIndex
    );
  };

  const updateCard = () => {
    const isFullTextMode = currentIndex === poem.sentences.length;
    
    if (isFullTextMode) {
      // 全文模式：合并展现
      const fullText = poem.sentences.map(s => s.text).join('');
      const fullTrans = poem.sentences.map(s => s.translation).join('<br><br>');
      const allKw = poem.keywords || [];
      const highlightedFullText = highlightKeywords(fullText, allKw);

      cardFront.innerHTML = `
        <div class="guwen-text text clickable" style="cursor: pointer; font-size: 1.15rem; line-height: 1.8; text-align: left; padding: 10px;">${highlightedFullText}</div>
        <div class="hint" style="text-transform: uppercase; letter-spacing: 1px; color: var(--accent);">—— 全篇综览 (Full Text) ——</div>
      `;

      cardBack.innerHTML = `
        <div class="text" style="font-size: 1rem; color: var(--text-main); line-height: 1.5; text-align: left;">${fullTrans}</div>
        <div class="hint">点击看原文</div>
      `;
      
      counter.innerHTML = `<span style="color: var(--accent); font-weight: bold;">[ 全篇回顾 ]</span>`;
      nextBtn.textContent = '已背完';
      nextBtn.style.opacity = '0.5';
      nextBtn.style.pointerEvents = 'none';
    } else {
      // 单句模式 (常规)
      const sentence = poem.sentences[currentIndex];
      const relevantKw = getRelevantKeywords(sentence.text, currentIndex);
      const highlightedText = highlightKeywords(sentence.text, relevantKw);

      cardFront.innerHTML = `
        <div class="guwen-text text clickable" style="cursor: pointer;">${highlightedText}</div>
        <div class="hint">${relevantKw.length > 0 ? '点击高亮词查看释义 · 点击卡片翻转' : '点击卡片翻转查看译文'}</div>
      `;

      cardBack.innerHTML = `
        <div class="text" style="font-size: 1.1rem; color: var(--text-main);">${sentence.translation}</div>
        <div class="hint">点击看原文</div>
      `;
      
      // 自动播放单句音频
      if (sentence.audioFile) {
        playClip(sentence.audioFile);
      }
      
      counter.textContent = `${currentIndex + 1} / ${poem.sentences.length}`;
      
      // 动态更新“下一句”按钮文字
      if (currentIndex === poem.sentences.length - 1) {
        nextBtn.textContent = '看全篇';
      } else {
        nextBtn.textContent = '下一句';
      }
      nextBtn.style.opacity = '1';
      nextBtn.style.pointerEvents = 'auto';
      // 元素发光效果
      cardFront.style.boxShadow = `0 0 30px rgba(79, 173, 238, 0.2)`;
    }

    cardInner.classList.remove('flipped');

    // 绑定关键词点击
    cardFront.querySelectorAll('.keyword-highlight').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation(); 
        showTooltip(el as HTMLElement);
      });
    });

    // 绑定点读
    cardFront.querySelector('.guwen-text')!.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('keyword-highlight')) return;
      e.stopPropagation();
      if (isFullTextMode) {
        // 全篇模式：点击停止或重新开始连读
        if (isPlaylistPlaying()) {
          stopAudio();
        } else {
          const allUrls = poem.sentences.map(s => s.audioFile).filter(u => !!u) as string[];
          playPlaylist(allUrls);
        }
      } else {
        const sentence = poem.sentences[currentIndex];
        if (sentence.audioFile) toggleClip(sentence.audioFile);
      }
    });

  };

  cardInner.addEventListener('click', () => {
    cardInner.classList.toggle('flipped');
  });

  const controls = document.createElement('div');
  controls.className = 'controls';
  
  const counter = document.createElement('div');
  counter.style.textAlign = 'center';
  counter.style.marginBottom = '1rem';
  counter.style.color = 'var(--text-dim)';
  
  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-secondary';
  prevBtn.textContent = '上一句';
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-primary';
  nextBtn.textContent = '下一句';

  btnGroup.appendChild(prevBtn);
  btnGroup.appendChild(nextBtn);
  controls.appendChild(counter);
  controls.appendChild(btnGroup);
  container.appendChild(controls);

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCard();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < poem.sentences.length) {
      currentIndex++;
      updateCard();
    }
  });

  header.querySelector('#back-btn')?.addEventListener('click', () => navigate('home'));
  header.querySelector('#mode-switch')?.addEventListener('click', () => navigate('chain', poem.id));

  // 手机滑动手势：左滑下一句，右滑上一句
  let touchStartX = 0;
  let touchStartY = 0;
  cardContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  cardContainer.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    
    // 水平滑动距离 > 50px 且大于垂直滑动（防止误触）
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0 && currentIndex < poem.sentences.length) {
        // 左滑 -> 下一步
        currentIndex++;
        updateCard();
      } else if (deltaX > 0 && currentIndex > 0) {
        // 右滑 -> 上一步
        currentIndex--;
        updateCard();
      }
    }
  }, { passive: true });

  updateCard();
  return container;
}
