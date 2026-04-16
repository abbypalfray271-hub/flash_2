import type { Poem, Sentence } from '../types';
import { saveCustomPoem, savePoemOverride } from '../utils/storage';
import { navigate } from '../utils/router';

export function renderPoemEditor(existingPoem?: Poem) {
  const container = document.createElement('div');
  container.className = 'editor-view';
  container.style.padding = '1rem';

  const isEditing = !!existingPoem;
  let sentences: Sentence[] = existingPoem ? JSON.parse(JSON.stringify(existingPoem.sentences)) : [];

  container.innerHTML = `
    <header class="app-header" style="margin-bottom: 2rem;">
      <h1 style="font-size: 1.5rem;">${isEditing ? '精修内容' : '录入新篇'}</h1>
      <p style="color: var(--text-dim); font-size: 0.8rem;">微调每一处细节，对标考试要求</p>
    </header>

    <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div class="input-group">
          <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">篇名</label>
          <input type="text" id="edit-title" value="${existingPoem?.title || ''}" placeholder="如：出师表" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
        </div>
        <div class="input-group">
          <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">作者</label>
          <input type="text" id="edit-author" value="${existingPoem?.author || ''}" placeholder="如：诸葛亮" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
         <div class="input-group">
          <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">年级</label>
          <select id="edit-grade" style="width: 100%; background: #2a2a2a; border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
            ${[3,4,5,6].map(g => `<option value="${g}" ${existingPoem?.grade === g ? 'selected' : ''}>${g}年级</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">学期</label>
          <select id="edit-semester" style="width: 100%; background: #2a2a2a; border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
            <option value="1" ${existingPoem?.semester === 1 ? 'selected' : ''}>上学期</option>
            <option value="2" ${existingPoem?.semester === 2 ? 'selected' : ''}>下学期</option>
          </select>
        </div>
      </div>

      <div class="input-group" style="margin-bottom: 1rem;">
        <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">分类</label>
         <select id="edit-category" style="width: 100%; background: #2a2a2a; border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
            <option value="prose" ${existingPoem?.category === 'prose' ? 'selected' : ''}>文言文</option>
            <option value="poetry" ${existingPoem?.category === 'poetry' ? 'selected' : ''}>古诗词</option>
          </select>
      </div>

      <div class="input-group">
        <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">音频文件名 (需放在 public/audio 下)</label>
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="edit-audio" value="${existingPoem?.audioFile?.split('/').pop() || ''}" placeholder="如：chushibiao.mp3" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0.6rem; border-radius: 6px;">
          <button id="btn-auto-audio" class="btn btn-secondary" style="font-size: 0.75rem; white-space: nowrap;">自动关联分句音频</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <label style="display: block; margin-bottom: 1rem; font-weight: bold; border-left: 3px solid var(--accent); padding-left: 0.5rem;">正文内容 (自动拆分)</label>
      <textarea id="raw-content" placeholder="在此粘贴录入全文，点击下方拆分..." style="width: 100%; height: 120px; background: rgba(0,0,0,0.2); border: 1px dashed var(--border); color: var(--text-main); padding: 0.75rem; border-radius: 8px; font-family: inherit; margin-bottom: 0.75rem;"></textarea>
      <button id="btn-parse" class="btn btn-secondary" style="width: 100%; font-size: 0.9rem;">⚡ 智能重新拆分</button>
    </div>

    <div id="sentence-list" style="margin-bottom: 6rem;">
       <!-- 句子编辑行将渲染于此 -->
    </div>

    <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 1rem; background: rgba(18, 18, 18, 0.9); backdrop-filter: blur(10px); border-top: 1px solid var(--border); z-index: 100; display: flex; gap: 0.75rem;">
      <button id="btn-cancel" class="btn btn-secondary" style="flex: 1;">取消</button>
      <button id="btn-save" class="btn btn-primary" style="flex: 2;">💾 保存全部修改</button>
    </div>
  `;

  const sentenceContainer = container.querySelector('#sentence-list')!;
  const rawInput = container.querySelector('#raw-content') as HTMLTextAreaElement;

  const renderSentences = () => {
    sentenceContainer.innerHTML = '';
    sentences.forEach((s, index) => {
      const row = document.createElement('div');
      row.className = 'chain-item';
      row.style.cssText = `margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.05); padding: 0.75rem;`;
      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; opacity: 0.5; font-size: 0.7rem;">
          <span>第 ${s.id} 句</span>
          <span class="btn-delete" style="cursor: pointer; color: #ff4444;">删除</span>
        </div>
        <input type="text" class="row-text" value="${s.text}" placeholder="原文" style="width: 100%; background: transparent; border: none; border-bottom: 1px solid #333; color: white; margin-bottom: 0.5rem; font-size: 1rem; outline: none;">
        <input type="text" class="row-trans" value="${s.translation}" placeholder="翻译 (选填)" style="width: 100%; background: transparent; border: none; color: var(--text-dim); font-size: 0.9rem; outline: none;">
        <div style="margin-top: 0.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.7rem; color: var(--accent); opacity: 0.6;">🎧</span>
          <input type="text" class="row-audio" value="${s.audioFile || ''}" placeholder="分句音频 (可选，如: audio/smg/1.mp3)" style="flex: 1; background: transparent; border: none; font-size: 0.7rem; color: var(--text-dim); outline: none;">
        </div>
      `;

      // 绑定编辑同步
      row.querySelector('.row-text')!.addEventListener('change', (e) => { sentences[index].text = (e.target as HTMLInputElement).value; });
      row.querySelector('.row-trans')!.addEventListener('change', (e) => { sentences[index].translation = (e.target as HTMLInputElement).value; });
      row.querySelector('.row-audio')!.addEventListener('change', (e) => { sentences[index].audioFile = (e.target as HTMLInputElement).value; });
      row.querySelector('.btn-delete')!.addEventListener('click', () => { sentences.splice(index, 1); renderSentences(); });

      sentenceContainer.appendChild(row);
    });

    if (sentences.length === 0) {
       sentenceContainer.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 2rem;">暂无句子，请粘贴全文解析或手动添加</div>`;
    }
  };

  // 智能拆分逻辑
  container.querySelector('#btn-parse')!.addEventListener('click', () => {
    const text = rawInput.value.trim();
    if (!text) return;
    
    // 正则拆分：句号、问号、叹号、分号、换行
    const rawSentences = text.split(/[。！？；\n]/).filter(s => s.trim().length > 0);
    sentences = rawSentences.map((s, idx) => ({
      id: idx + 1,
      text: s.trim() + (text.includes(s) && text[text.indexOf(s) + s.length].match(/[。！？；]/) ? text[text.indexOf(s) + s.length] : ''),
      translation: ''
    }));
    renderSentences();
  });

  // 保存逻辑
  container.querySelector('#btn-save')!.addEventListener('click', () => {
    const title = (container.querySelector('#edit-title') as HTMLInputElement).value.trim();
    const author = (container.querySelector('#edit-author') as HTMLInputElement).value.trim();
    if (!title || sentences.length === 0) {
      alert('请确保已输入标题且已解析正文');
      return;
    }

    const finalPoem: Poem = {
      id: existingPoem?.id || `custom-${Date.now()}`,
      title,
      author,
      dynasty: existingPoem?.dynasty || '未知',
      source: existingPoem?.source || '手动录入',
      grade: parseInt((container.querySelector('#edit-grade') as HTMLSelectElement).value) as any,
      semester: parseInt((container.querySelector('#edit-semester') as HTMLSelectElement).value) as any,
      category: (container.querySelector('#edit-category') as HTMLSelectElement).value as any,
      sentences,
      audioFile: `audio/${(container.querySelector('#edit-audio') as HTMLInputElement).value.trim() || title + '.mp3'}`,
      isCustom: true
    };

    if (existingPoem && !existingPoem.id.startsWith('custom-')) {
       // 修改的是内置篇目 -> 使用 Override
       savePoemOverride(finalPoem);
    } else {
       // 新增或修改自定义篇目
       saveCustomPoem(finalPoem);
    }
    
    navigate('home');
  });

  // 自动关联音频逻辑
  container.querySelector('#btn-auto-audio')!.addEventListener('click', () => {
    const title = (container.querySelector('#edit-title') as HTMLInputElement).value.trim();
    if (!title) {
      alert('请先输入篇名以便生成文件夹路径');
      return;
    }
    const folder = prompt('请输入音频子目录名（需位于 audio/ 下）', title);
    if (!folder) return;

    sentences.forEach((s, idx) => {
      s.audioFile = `audio/${folder}/${idx + 1}.mp3`;
    });
    renderSentences();
    alert(`已自动生成 ${sentences.length} 个分句音频路径！请确保文件存在。`);
  });

  container.querySelector('#btn-cancel')!.addEventListener('click', () => navigate('home'));

  renderSentences();
  return container;
}
