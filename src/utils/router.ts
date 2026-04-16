import type { AppView, AppState } from '../types';

/**
 * 解析当前 Hash 路径
 * 格式支持:
 * #/ -> home
 * #/study/:id/flashcard -> flashcard
 * #/study/:id/chain -> chain
 */
export function parseHash(): AppState {
  const hash = decodeURIComponent(window.location.hash || '#/');
  if (hash === '#/') return { view: 'home' };

  const parts = hash.split('/'); // ["#", "study", "poem-id", "mode"]
  
  if (parts[1] === 'add') return { view: 'add' };
  
  if (parts[1] === 'edit' && parts[2]) {
    return { view: 'edit', currentPoemId: parts[2] };
  }

  if (parts[1] === 'study' && parts[2]) {
    const poemId = parts[2];
    const mode = parts[3] as AppView;
    if (mode === 'flashcard' || mode === 'chain') {
      return { view: mode, currentPoemId: poemId };
    }
  }

  return { view: 'home' };
}

/**
 * 导航到指定视图
 */
export function navigate(view: AppView, poemId?: string) {
  if (view === 'home') {
    window.location.hash = '#/';
  } else if (view === 'add') {
    window.location.hash = '#/add';
  } else if (view === 'edit' && poemId) {
    window.location.hash = `#/edit/${poemId}`;
  } else if (poemId) {
    window.location.hash = `#/study/${poemId}/${view}`;
  }
}

/**
 * 监听路由变化
 */
export function listenToHashChange(callback: (state: AppState) => void) {
  window.addEventListener('hashchange', () => {
    callback(parseHash());
  });
}
