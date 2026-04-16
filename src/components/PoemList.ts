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

  // 这里的 userStats 需要提前获取
  const userStats = getUserStats();

  // 头部
  const header = document.createElement('header');
  header.className = 'app-header';
  header.style.marginBottom = '1.5rem';
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-family: var(--font-serif); font-weight: 700; color: var(--accent); letter-spacing: 1px;">${userStats.nickname} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-dim);">旅行者</span></h1>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <p style="color: var(--text-dim); font-size: 0.8rem; font-weight: 600;">冒险等阶 ${({7:'初一',8:'初二',9:'初三'} as Record<number,string>)[userStats.grade] || userStats.grade} · 探索提瓦特中</p>
          <span class="badge-honor" style="background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 700;">${getAchievementTitle(masteredCount)}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <button id="admin-toggle" class="btn" style="padding: 0.4rem 0.6rem; font-size: 0.75rem; border: 2px solid #6BCBFF; background: transparent; color: #6BCBFF; border-radius: 12px; font-weight: bold;">
          ${isAdmin() ? '已解锁管理' : '管理锁'}
        </button>
      </div>
    </div>
  `;
  container.appendChild(header);

  // 打卡状态
  const today = getTodayStr();
  const isCheckedIn = userStats.lastCheckInDate === today;

  const checkInArea = document.createElement('div');
  checkInArea.className = 'checkin-banner card';
  checkInArea.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem; margin-bottom: 2rem; border: 1px solid var(--accent-border);
    background: linear-gradient(to right, var(--accent-soft), transparent);
  `;
  
  checkInArea.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 1.5rem;">🔥</div>
      <div>
        <div style="font-size: 0.9rem; font-weight: bold; letter-spacing: 1px;">连续探索 ${userStats.checkInStreak} 天</div>
        <div id="eggy-reward-info" style="margin-top: 12px; cursor: help;">
          <div style="font-size: 0.8rem; color: var(--accent); font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 4px; text-transform: uppercase;">
            神之眼与圣遗物 <span style="font-size: 0.6rem; opacity: 0.7;">(点击查看攻略ⓘ)</span>
          </div>
          <div style="display: flex; gap: 16px; padding: 12px 6px;">
            ${['风神瞳', '原石', '纠缠之缘', '神之眼'].map((t, i) => {
              const days = [3, 7, 15, 30][i];
              const hasIt = userStats.masteredTools.includes(t);
              const activeStyle = hasIt ? `
                position: relative; width: 54px; height: 54px;
                display: flex; align-items: center; justify-content: center;
                background: var(--accent-soft); border: 2px solid var(--accent);
                box-shadow: 0 0 15px rgba(255, 193, 7, 0.3); border-radius: 4px;
              ` : `
                width: 54px; height: 54px; border-radius: 4px; background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
              `;

              return `
                <div title="${hasIt ? `已获得：${t}` : `连续探索 ${days} 天解锁`}" style="${activeStyle}">
                  <div style="
                    width: 44px; height: 44px; 
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.6rem; transition: all 0.3s;
                  ">
                    <span style="opacity: ${hasIt ? 1 : 0.15}; filter: ${hasIt ? 'none' : 'grayscale(1)'};">
                      ${t === '风神瞳' ? '💠' : t === '原石' ? '✨' : t === '纠缠之缘' ? '🌑' : '💎'}
                    </span>
                    ${!hasIt ? `<div style="position: absolute; bottom: 3px; font-size: 0.55rem; color: #555; font-weight: 900;">${days}D</div>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
        <div id="reward-hint" style="display:none; font-size: 0.72rem; color: var(--accent); margin-top: 16px; padding: 14px; background: rgba(255,193,7,0.1); border-radius: 4px; border: 1px dashed var(--accent); animation: eggyPop 0.3s; line-height: 1.5;">
          📅 **冒险指南**：通过每日探索获得**原石与神之眼**！连续探索 **3/7/15/30** 天即可解锁。
        </div>
      </div>
    </div>
    <button id="btn-checkin" class="btn ${isCheckedIn ? 'btn-secondary' : 'btn-primary'}" style="padding: 0.5rem 1rem; font-size: 0.85rem;" ${isCheckedIn ? 'disabled' : ''}>
      ${isCheckedIn ? '今日委托已毕' : '开启今日委托'}
    </button>
  `;
  container.appendChild(checkInArea);

  checkInArea.querySelector('#eggy-reward-info')?.addEventListener('click', () => {
    const hint = checkInArea.querySelector('#reward-hint') as HTMLElement;
    if (hint) hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
  });

  checkInArea.querySelector('#btn-checkin')?.addEventListener('click', () => {
    const result = performCheckIn();
    if (result.success) {
      showCheckInModal(result.streak, getUserStats().masteredTools, poems, () => {
        window.location.reload(); // 刷新以更新状态
      });
    }
  });

  // 管理菜单 (仅在管理员模式显示)
  if (isAdmin()) {
    const adminActions = document.createElement('div');
    adminActions.className = 'card';
    adminActions.style.cssText = `margin-bottom: 1.5rem; padding: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; background: rgba(255,191,0,0.05); border: 1px dashed var(--accent);`;
    adminActions.innerHTML = `
      <button id="nav-add" class="btn btn-primary" style="flex: 1; min-width: 120px; font-size: 0.85rem;">+ 录入新篇</button>
      <button id="btn-export" class="btn btn-secondary" style="flex: 1; min-width: 80px; font-size: 0.85rem;">📥 备份</button>
      <button id="btn-import-trigger" class="btn btn-secondary" style="flex: 1; min-width: 80px; font-size: 0.85rem;">📤 恢复</button>
      <button id="admin-logout" class="btn" style="font-size: 0.85rem; color: #ff4444;">锁定</button>
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
        alert('恢复成功！');
        window.location.reload();
      } else {
        alert('恢复失败，文件格式有误');
      }
    });

    adminActions.querySelector('#admin-logout')!.addEventListener('click', () => {
      setAdmin(false);
      window.location.reload();
    });
  }

  // 搜索框
  const searchContainer = document.createElement('div');
  searchContainer.style.marginBottom = '1.5rem';
  searchContainer.innerHTML = `
    <input type="text" id="poem-search" placeholder="搜索篇名或作者..." 
      style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: var(--card-bg); border: 1px solid var(--border); color: var(--text-main); font-size: 1rem; outline: none;">
  `;
  container.appendChild(searchContainer);

  const tabContainer = document.createElement('div');
  tabContainer.className = 'category-tabs';
  tabContainer.innerHTML = `
    <div class="tab active" data-category="prose">文言文</div>
    <div class="tab" data-category="poetry">古诗词</div>
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
        section.style.marginBottom = '2rem';
        const semesterLabel = semester === 1 ? '上学期' : '下学期';
        const isUserGrade = grade === userStats.grade;
        section.innerHTML = `
          <h2 style="margin-bottom: 1rem; font-size: 1.1rem; color: ${isUserGrade ? 'var(--accent)' : 'var(--text-dim)'}; display: flex; align-items: center; gap: 8px;">
            ${({7:'初一',8:'初二',9:'初三'} as Record<number,string>)[grade] || grade+'年级'} ${semesterLabel}
            ${isUserGrade ? '<span style="font-size: 0.6rem; background: var(--accent); color: #000; padding: 2px 6px; border-radius: 10px;">当前年级</span>' : ''}
          </h2>
        `;

        semesterPoems.forEach(poem => {
          const progress = allProgress[poem.id] || { masteredSentences: [] };
          const percent = Math.round((progress.masteredSentences.length / poem.sentences.length) * 100);

          const card = document.createElement('div');
          card.className = `poem-card ${percent === 100 ? 'mastered' : ''}`;
          card.style.position = 'relative'; 
          card.innerHTML = `
            ${percent === 100 ? '<div class="mastered-seal" style="font-size:0.6rem;">MAX</div>' : ''}
            <div class="poem-info">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                <h3 style="margin: 0;">${poem.title}</h3>
                ${(poem as any).isModified ? '<span style="font-size: 0.65rem; background: rgba(255,191,0,0.15); color: var(--accent); padding: 1px 4px; border-radius: 4px;">已修正</span>' : ''}
                ${poem.isCustom && !(poem as any).isModified ? '<span style="font-size: 0.65rem; background: rgba(0,255,150,0.1); color: #00ff96; padding: 1px 4px; border-radius: 4px;">自建</span>' : ''}
              </div>
              <div class="poem-meta">${poem.author} · ${poem.sentences.length}句</div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${isAdmin() ? `<button class="btn-edit" style="background: none; border: none; color: var(--accent); font-size: 1.1rem; cursor: pointer;">✏️</button>` : ''}
              ${isAdmin() && poem.isCustom && !(poem as any).isModified ? `<button class="btn-delete" style="background: none; border: none; color: #ff4444; font-size: 1.1rem; cursor: pointer;">🗑️</button>` : ''}
              <div class="poem-progress">
                 <svg viewBox="0 0 36 36" style="width: 44px; height: 44px; transform: rotate(-90deg);">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" stroke-width="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" stroke-width="3" 
                      stroke-dasharray="${percent}, 100" stroke-linecap="round" />
                    <text x="18" y="-14" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--text-main)" transform="rotate(90)" dy="0.35em">${percent}%</text>
                  </svg>
              </div>
            </div>
          `;

          card.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.btn-edit')) {
              navigate('edit', poem.id);
            } else if (target.closest('.btn-delete')) {
              if (confirm(`确定要删除《${poem.title}》吗？`)) {
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
      listContainer.innerHTML = `<div style="text-align: center; padding: 4rem 1rem; color: var(--text-dim);">未找到相关篇目</div>`;
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
