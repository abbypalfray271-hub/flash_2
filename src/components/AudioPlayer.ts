/**
 * 全局单一音频播放器实例管理
 */
let currentAudio: HTMLAudioElement | null = null;
let currentClip: HTMLAudioElement | null = null;
let playlistQueue: string[] = [];
let onToggleCallback: ((isPlaying: boolean, hasError?: boolean) => void) | null = null;

export function initAudio(audioUrl: string, onToggle: (isPlaying: boolean, hasError?: boolean) => void) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  onToggleCallback = onToggle;
  currentAudio = new Audio(audioUrl);
  
  currentAudio.addEventListener('error', () => {
    if (onToggleCallback) onToggleCallback(false, true);
  });
  
  currentAudio.addEventListener('canplaythrough', () => {
    if (onToggleCallback) onToggleCallback(false, false);
  });
  
  currentAudio.addEventListener('ended', () => {
    if (onToggleCallback) onToggleCallback(false);
  });
}

export function toggleAudio() {
  if (!currentAudio) return;
  if (currentAudio.paused) {
    // 播放全文前，先彻底停掉可能正在播的单句 (Clip)
    if (currentClip) {
      currentClip.pause();
      currentClip = null;
    }

    currentAudio.play().catch(e => {
      // 忽略自动播放拦截错误 (NotAllowedError)
      if (e.name !== 'NotAllowedError') {
        if (onToggleCallback) onToggleCallback(false, true);
      }
      console.warn('Playback failed:', e);
    });
    if (onToggleCallback) onToggleCallback(true);
  } else {
    currentAudio.pause();
    if (onToggleCallback) onToggleCallback(false);
  }
}

export function stopAudio() {
  playlistQueue = []; // 清空播放队列
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (onToggleCallback) onToggleCallback(false);
  }
  if (currentClip) {
    currentClip.pause();
    currentClip = null;
  }
}

/**
 * 切换单句音频的播放/暂停状态 (实现循环点击互动)
 */
export function toggleClip(url: string) {
  // 核心修复：对 src 进行解码，防止中文路径因 URL 编码导致匹配失败
  if (currentClip && decodeURIComponent(currentClip.src).includes(url)) {
    if (!currentClip.paused) {
      currentClip.pause();
    } else {
      currentClip.play().catch(() => {});
    }
    return;
  }

  // 否则，停掉旧的并强制播放新的
  playClip(url);
}

/**
 * 强制播放一段音频切片 (通常用于切页自动播报)
 */
export function playClip(url: string) {
  playlistQueue = []; // 手动播放单句时清空可能的队列
  if (currentClip) {
    currentClip.pause();
  }
  currentClip = new Audio(url);
  currentClip.play().catch(() => {
    console.warn('Clip play blocked by autoplay policy');
  });
}

/**
 * 连贯播放一组音频片段
 */
export function playPlaylist(urls: string[]) {
  stopAudio();
  playlistQueue = urls.filter(u => !!u);
  playNextInQueue();
}

/**
 * 检查当前是否有队列正在播放
 */
export function isPlaylistPlaying() {
  return playlistQueue.length > 0 || (currentClip && !currentClip.paused);
}

function playNextInQueue() {
  if (playlistQueue.length === 0) return;
  
  const url = playlistQueue.shift()!;
  currentClip = new Audio(url);
  
  currentClip.addEventListener('ended', () => {
    playNextInQueue();
  });

  currentClip.play().catch(e => {
    console.warn('Playlist playback failed or interrupted', e);
    playlistQueue = [];
  });
}

/**
 * 提供一个静默解锁音频的方法，供用户首次交互调用
 */
export function unlockAudio() {
  const silentAudio = new Audio();
  silentAudio.play().catch(() => {});
}

export function renderAudioButton() {
  const btn = document.createElement('button');
  btn.className = 'btn audio-fab';
  
  // 绑定点击事件 (修正：之前修改漏掉了事件监听)
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡到卡片
    toggleAudio();
  });

  btn.style.cssText = `
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: var(--card-bg);
    border: 1px solid var(--accent-border);
    padding: 0;
    z-index: 200;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    transition: all 0.3s ease;
  `;

  // 添加移动端避让样式
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 480px) {
      .audio-fab {
        top: auto !important;
        bottom: 2rem !important;
        right: 1.25rem !important;
        width: 3.2rem !important;
        height: 3.2rem !important;
      }
    }
  `;
  document.head.appendChild(style);

  return {
    element: btn,
    updateState: (isPlaying: boolean, _hasError: boolean = false) => {
      btn.style.borderColor = isPlaying ? 'var(--accent)' : 'var(--accent-border)';
      btn.style.color = isPlaying ? 'var(--accent)' : 'var(--text-main)';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      if (isPlaying) btn.classList.add('audio-playing');
      else btn.classList.remove('audio-playing');
    }
  };
}
