import type { Poem } from '../types';
import { getAllProgress, getCustomPoems, getAllOverrides, deleteCustomPoem, exportBackup, importBackup } from '../utils/storage';
import { navigate } from '../utils/router';
import { isAdmin, setAdmin } from '../utils/auth';
import { showAuthModal } from './AuthModal';
import { getUserStats } from '../utils/storage';
import { getTodayStr, performCheckIn } from '../utils/checkin';
import { showCheckInModal } from './CheckInModal';

export function renderPoemList(builtInPoems: Poem[]) {
  const allProgress = getAllProgress();
  const customList = getCustomPoems();
  const overrides = getAllOverrides();
  
  // 合并逻辑：BuiltIn (带 Override) + Custom
  const mergedPoems = builtInPoems.map(p => {
    if (overrides[p.id]) {
      return { ...overrides[p.id], isModified: true };
    }
    return p;
  });

  const poems = [...mergedPoems, ...customList];

  // 计算掌握总篇数 (100% 进度)
  const masteredCount = poems.filter(p => {
    const progress = allProgress[p.id];
    return progress && progress.masteredSentences.length === p.sentences.length;
  }).length;

  const getAchievementTitle = (count: number) => {
    if (count === 0) return '初抵达者';
    if (count <= 5) return '西风骑士';
    if (count <= 15) return '璃月冒险家';
    if (count <= 35) return '神选之子';
    if (count <= 70) return '尘世执政';
    if (count <= 110) return '降临者';
    return '天理维系者';
  };

  const container = document.createElement('div');
  container.className = 'poem-list-view';

  const userStats = getUserStats();

  // 头部 (Teyvat Character Panel Style)
  const header = document.createElement('header');
  header.className = 'app-header';
  header.style.marginBottom = '2rem';
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-family: var(--font-serif); font-weight: 700; color: var(--accent); letter-spacing: 2px; margin: 0;">
          ${userStats.nickname} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-dim); opacity: 0.8;">· 旅行者</span>
        </h1>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 6px;">
          <p style="color: var(--text-dim); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            冒险等阶 ${({7:'初一',8:'初二',9:'初三'} as Record<number,string>)[userStats.grade] || userStats.grade}
          </p>
          <span class="badge-honor">${getAchievementTitle(masteredCount)}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button id="admin-toggle" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; border-color: var(--border); letter-spacing: 1px;">
          ${isAdmin() ? '已解锁权限' : '权限锁定'}
        </button>
      </div>
    </div>
  `;
  container.appendChild(header);

  // 今日委托 (Daily Commission Banner)
  const today = getTodayStr();
  const isCheckedIn = userStats.lastCheckInDate === today;

  const checkInArea = document.createElement('div');
  checkInArea.className = 'tiyvat-reward-panel card';
  checkInArea.style.cssText = `
    padding: 1.5rem; margin-bottom: 2.2rem; border: 1px solid var(--accent-border);
    background: linear-gradient(135deg, rgba(255,193,7,0.05) 0%, transparent 100%);
    position: relative; overflow: hidden;
  `;
  
  checkInArea.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem; filter: drop-shadow(0 0 5px var(--accent));">✦</span>
          <span style="font-size: 0.95rem; font-weight: 800; letter-spacing: 2px; color: #fff;">今日委托进展</span>
          <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600; margin-left: 8px;">连续 ${userStats.checkInStreak} 天</span>
        </div>
        <button id="btn-checkin" class="btn ${isCheckedIn ? 'btn-secondary' : 'btn-primary'}" style="padding: 0.4rem 1.2rem; font-size: 0.8rem;" ${isCheckedIn ? 'disabled' : ''}>
          ${isCheckedIn ? '委托已毕' : '开启委托'}
        </button>
      </div>

      <div id="tiyvat-reward-info" style="cursor: help;">
        <div style="display: flex; gap: 14px; justify-content: flex-start;">
          ${['风神瞳', '原石', '纠缠之缘', '神之眼'].map((t, i) => {
            const days = [3, 7, 15, 30][i];
            const hasIt = userStats.masteredTools.includes(t);
            const activeStyle = hasIt ? `
              position: relative; width: 52px; height: 52px;
              display: flex; align-items: center; justify-content: center;
              background: var(--accent-soft); border: 2px solid var(--accent);
              box-shadow: 0 0 15px rgba(255, 193, 7, 0.2); border-radius: 4px;
            ` : `
              width: 52px; height: 52px; border-radius: 4px; background: rgba(0,0,0,0.3);
              border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;
              position: relative;
            `;

            return `
              <div title="${hasIt ? `已获得：${t}` : `累计探索 ${days} 天解锁`}" style="${activeStyle}">
                <div style="font-size: 1.6rem; opacity: ${hasIt ? 1 : 0.2}; filter: ${hasIt ? 'none' : 'grayscale(1)'};">
                  ${t === '风神瞳' ? '💠' : t === '原石' ? '✨' : t === '纠缠之缘' ? '🌑' : '💎'}
                </div>
                ${!hasIt ? `<div style="position: absolute; bottom: 4px; font-size: 0.5rem; color: var(--text-dim); font-weight: 800;">${days}D</div>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>
      
      <div id="reward-hint" style="display:none; font-size: 0.75rem; color: var(--accent); margin-top: 5px; padding: 12px; background: rgba(255,193,7,0.05); border: 1px dashed var(--accent-border); animation: tiyvatPopIn 0.3s; line-height: 1.6;">
        📅 **冒险指南**：每日完成至少一项挑战并“开启委托”，累计天数即可赢取**珍稀物资**。
      </div>
    </div>
  `;
  container.appendChild(checkInArea);

  checkInArea.querySelector('#tiyvat-reward-info')?.addEventListener('click', () => {
    const hint = checkInArea.querySelector('#reward-hint') as HTMLElement;
    if (hint) hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
  });

  checkInArea.querySelector('#btn-checkin')?.addEventListener('click', () => {
    const result = performCheckIn();
    if (result.success) {
      showCheckInModal(result.streak, getUserStats().masteredTools, poems, () => {
        window.location.reload(); 
      });
    }
  });

  // 管理菜单 (Only Admin)
  if (isAdmin()) {
    const adminActions = document.createElement('div');
    adminActions.className = 'tiyvat-card';
    adminActions.style.cssText = `margin-bottom: 2rem; padding: 1rem; display: flex; gap: 0.8rem; flex-wrap: wrap; background: rgba(255,193,7,0.03);`;
    adminActions.innerHTML = `
      <button id="nav-add" class="btn btn-primary" style="flex: 1; min-width: 120px; font-size: 0.8rem;">+ 录入新篇</button>
      <button id="btn-export" class="btn btn-secondary" style="flex: 1; min-width: 80px; font-size: 0.8rem;">📥 备份</button>
      <button id="btn-import-trigger" class="btn btn-secondary" style="flex: 1; min-width: 80px; font-size: 0.8rem;">📤 恢复</button>
      <button id="admin-logout" class="btn" style="font-size: 0.8rem; color: var(--error); border-color: var(--error); opacity: 0.8;">锁定存档</button>
      <input type="file" id="import-file" style="display: none;" accept=".json">
    `;
    container.appendChild(adminActions);

    adminActions.querySelector('#nav-add')!.addEventListener('click', () => navigate('add'));
    adminActions.querySelector('#btn-export')!.addEventListener('click', () => exportBackup());
    
    const fileInput = adminActions.querySelector('#import-file') as HTMLInputElement;
    adminActions.querySelector('#btn-import-trigger')!.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      if (importBackup(text)) {
        alert('存档恢复成功！');
        window.location.reload();
      } else {
        alert('文件解析失败，请检查格式');
      }
    });

    adminActions.querySelector('#admin-logout')!.addEventListener('click', () => {
      setAdmin(false);
      window.location.reload();
    });
  }

  // 搜索框
  const searchContainer = document.createElement('div');
  searchContainer.style.marginBottom = '1.8rem';
  searchContainer.innerHTML = `
    <input type="text" id="poem-search" class="tiyvat-input" placeholder="搜索篇目、作者、名句..." 
      style="padding-left: 1.2rem; letter-spacing: 1px;">
  `;
  container.appendChild(searchContainer);

  const tabContainer = document.createElement('div');
  tabContainer.className = 'category-tabs';
  tabContainer.innerHTML = `
    <div class="tab active" data-category="prose">文言文 (Prose)</div>
    <div class="tab" data-category="poetry">古诗词 (Poetry)</div>
  `;
  container.appendChild(tabContainer);

  const listContainer = document.createElement('div');
  container.appendChild(listContainer);

  let currentCategory: 'prose' | 'poetry' = 'prose';

  const renderList = (filterText: string = '') => {
    listContainer.innerHTML = '';
    const query = filterText.toLowerCase();

    const grades = [7, 8, 9];
    grades.forEach(grade => {
      [1, 2].forEach(semester => {
        const semesterPoems = poems.filter(p => 
          p.category === currentCategory &&
          p.grade === grade && 
          p.semester === semester &&
          (p.title.toLowerCase().includes(query) || p.author.toLowerCase().includes(query))
        );
        
        if (semesterPoems.length === 0) return;

        const section = document.createElement('section');
        section.style.marginBottom = '2.2rem';
        const semesterLabel = semester === 1 ? '上学期' : '下学期';
        const isUserGrade = grade === userStats.grade;
        section.innerHTML = `
          <h2 style="margin-bottom: 1.2rem; font-size: 1rem; color: ${isUserGrade ? 'var(--accent)' : 'var(--text-dim)'}; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1px;">
            ${({7:'初一',8:'初二',9:'初三'} as Record<number,string>)[grade] || grade+'年级'} · ${semesterLabel}
            ${isUserGrade ? '<span class="badge-honor" style="margin-left: 8px; font-size: 0.6rem;">当前等阶</span>' : ''}
          </h2>
        `;

        semesterPoems.forEach(poem => {
          const progress = allProgress[poem.id] || { masteredSentences: [] };
          const percent = Math.round((progress.masteredSentences.length / poem.sentences.length) * 100);

          const card = document.createElement('div');
          card.className = `poem-card ${percent === 100 ? 'mastered' : ''}`;
          card.style.position = 'relative'; 
          card.innerHTML = `
            ${percent === 100 ? '<div class="mastered-seal" style="font-size:0.55rem;">MAX</div>' : ''}
            <div class="poem-info">
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem;">
                <h3 style="margin: 0; font-size: 1.15rem;">${poem.title}</h3>
                ${(poem as any).isModified ? '<span style="font-size: 0.6rem; color: var(--accent); opacity: 0.8; font-weight: 800;">[修正]</span>' : ''}
                ${poem.isCustom && !(poem as any).isModified ? '<span style="font-size: 0.6rem; color: var(--element-anemo); font-weight: 800;">[自建]</span>' : ''}
              </div>
              <div class="poem-meta">${poem.author} · ${poem.sentences.length} 句</div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.2rem;">
              ${isAdmin() ? `<button class="btn-edit" style="background: none; border: none; color: var(--accent); font-size: 1rem; cursor: pointer; opacity: 0.6;">✏️</button>` : ''}
              ${isAdmin() && poem.isCustom && !(poem as any).isModified ? `<button class="btn-delete" style="background: none; border: none; color: var(--error); font-size: 1rem; cursor: pointer; opacity: 0.6;">🗑️</button>` : ''}
              <div class="poem-progress">
                 <svg viewBox="0 0 36 36" style="width: 44px; height: 44px; transform: rotate(-90deg);">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" stroke-width="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" stroke-width="3" 
                      stroke-dasharray="${percent}, 100" stroke-linecap="round" />
                    <text x="18" y="-14" text-anchor="middle" font-size="9" font-weight="900" fill="var(--text-main)" transform="rotate(90)" dy="0.35em">${percent}%</text>
                  </svg>
              </div>
            </div>
          `;

          card.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.btn-edit')) {
              navigate('edit', poem.id);
            } else if (target.closest('.btn-delete')) {
              if (confirm(`确定要删除存档《${poem.title}》吗？`)) {
                deleteCustomPoem(poem.id);
                window.location.reload();
              }
            } else {
              navigate('flashcard', poem.id);
            }
          });

          section.appendChild(card);
        });

        listContainer.appendChild(section);
      });
    });

    if (listContainer.innerHTML === '') {
      listContainer.innerHTML = `<div style="text-align: center; padding: 5rem 1rem; color: var(--text-dim); letter-spacing: 1px; font-size: 0.9rem;">暂无与之共鸣的篇目</div>`;
    }
  };

  const searchInput = searchContainer.querySelector('#poem-search') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    renderList((e.target as HTMLInputElement).value);
  });

  tabContainer.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = (tab as HTMLElement).dataset.category as 'prose' | 'poetry';
      renderList();
    });
  });

  container.querySelector('#admin-toggle')!.addEventListener('click', () => {
    if (isAdmin()) {
       setAdmin(false);
       window.location.reload();
    } else {
       showAuthModal(() => window.location.reload());
    }
  });

  renderList();
  return container;
}
