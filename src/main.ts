import './style.css';
import { parseHash, listenToHashChange } from './utils/router';
import { renderPoemList } from './components/PoemList';
import { renderFlashCard } from './components/FlashCard';
import { renderChainChallenge } from './components/ChainChallenge';
import { renderPoemEditor } from './components/PoemEditor';
import { stopAudio } from './components/AudioPlayer';
import { getCustomPoems, getAllOverrides, getUserStats } from './utils/storage';
import { renderRegistration } from './components/Registration';
import poemsData from './data/poems.json';
import type { Poem } from './types';
import { initGlobalErrorHandling, showErrorUI } from './utils/debug';

// 启动异常监控
initGlobalErrorHandling();

const builtInPoems = poemsData as Poem[];
const appElement = document.querySelector<HTMLDivElement>('#app')!;

function updateApp() {
  const stats = getUserStats();
  const isUnlocked = sessionStorage.getItem('magic_book_unlocked') === 'true';
  
  // 魔法书契约检查：未注册 或 此会话未解锁
  if (!stats.nickname || !stats.contact || !isUnlocked) {
    appElement.innerHTML = '';
    renderRegistration(() => {
      sessionStorage.setItem('magic_book_unlocked', 'true');
      window.location.reload(); 
    });
    return;
  }

  const { view, currentPoemId } = parseHash();
  appElement.innerHTML = ''; // Clear current view

  if (view === 'home') {
    stopAudio();
    appElement.appendChild(renderPoemList(builtInPoems));
  } else if (view === 'add') {
    appElement.appendChild(renderPoemEditor());
  } else if (currentPoemId) {
    // 获取篇目数据 (优先查找自定义列表和重写版本)
    const customList = getCustomPoems();
    const overrides = getAllOverrides();
    let poem = customList.find(p => p.id === currentPoemId) || 
               overrides[currentPoemId] || 
               builtInPoems.find(p => p.id === currentPoemId);

    if (!poem) {
      window.location.hash = '#/';
      return;
    }

    if (view === 'edit') {
      appElement.appendChild(renderPoemEditor(poem));
    } else if (view === 'flashcard') {
      appElement.appendChild(renderFlashCard(poem));
    } else if (view === 'chain') {
      appElement.appendChild(renderChainChallenge(poem));
    }
  }
}



// Initial render
try {
  updateApp();
} catch (e) {
  showErrorUI(`[Bootstrap Error]\n${e instanceof Error ? e.message : String(e)}\nStack: ${e instanceof Error ? e.stack : 'No stack'}`);
}

// Listen for navigation
listenToHashChange(() => {
  try {
    updateApp();
  } catch (e) {
    showErrorUI(`[Navigation Error]\n${e instanceof Error ? e.message : String(e)}`);
  }
});
