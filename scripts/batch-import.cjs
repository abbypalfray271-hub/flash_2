/**
 * 批量导入脚本（初中版）：扫描 D:\二三言\初中 资源目录
 * 自动读取所有 Excel -> 生成 poems.json
 * 自动拷贝音频切片 -> public/audio/[id]/
 */
const { createRequire } = require('module');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\二三言\\初中';
const AUDIO_TARGET = path.resolve('./public/audio');
const OUTPUT_JSON = path.resolve('./src/data/poems.json');

// 从目录名提取年级和学期
// 初中目录结构: 初一(上), 初一(下), 初二(上), 初二(下), 初三(上), 初三(下)
function parseGradeInfo(gradeDir, catDir) {
  // gradeDir: "初一(上)" -> grade=7, semester=1
  const gradeMap = { '初一': 7, '初二': 8, '初三': 9 };
  let grade = 7;
  for (const [key, val] of Object.entries(gradeMap)) {
    if (gradeDir.includes(key)) { grade = val; break; }
  }
  
  const isUp = gradeDir.includes('上');
  const semester = isUp ? 1 : 2;
  
  // catDir: "文言文" or "诗词" -> category
  const category = catDir.startsWith('诗') ? 'poetry' : 'prose';
  
  return { grade, semester, category };
}

// 从文件夹名提取篇名
function extractTitle(folderName) {
  // 尝试提取《xxx》中的内容
  const match = folderName.match(/《(.+?)》/);
  if (match) return match[1];
  
  // 如果没有书名号，使用文件夹名的最后一段
  const parts = folderName.split(/[\\\/]/);
  return parts[parts.length - 1].replace(/^\d+\s*/, '').replace(/小学[必背]*[古诗文言文]*[诵读加讲解]*/, '').trim();
}

// 生成安全的ID
function makeId(grade, semester, title) {
  const pinyin = title.replace(/[·（）\(\)《》\s]/g, '');
  return `grade${grade}-${semester}-${pinyin}`;
}

function processFolder(folderPath, gradeDir, catDir) {
  const { grade, semester, category } = parseGradeInfo(gradeDir, catDir);
  
  // 查找 Excel
  const files = fs.readdirSync(folderPath);
  const excelFile = files.find(f => f.startsWith('语句导入模板') && f.endsWith('.xlsx'));
  if (!excelFile) {
    console.log(`  ⚠️ 跳过 (无 Excel): ${folderPath}`);
    return null;
  }
  
  const folderName = path.basename(folderPath);
  const title = extractTitle(folderName);
  const id = makeId(grade, semester, title);
  
  // 读取 Excel
  const wb = XLSX.readFile(path.join(folderPath, excelFile));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // 提取句子 (跳过表头和空行，只取有内容的行)
  const sentences = [];
  let author = '';
  
  for (const row of rows) {
    if (!row[0] || row[0] === '语句内容') continue; // 跳过表头
    
    const text = String(row[0]).trim();
    const translation = row[1] ? String(row[1]).trim() : '';
    const group = row[2];
    const order = row[3];
    
    // 作者行特征：排序为 0, 通常包含朝代信息
    if (order === 0 || (text.includes('〔') && text.includes('〕'))) {
      author = text;
      continue;
    }
    
    // 空行跳过
    if (!text || text.length < 2) continue;
    
    sentences.push({
      id: sentences.length + 1,
      text,
      translation
    });
  }
  
  if (sentences.length === 0) {
    console.log(`  ⚠️ 跳过 (无句子): ${title}`);
    return null;
  }
  
  // 处理音频
  const audioClipDir = path.join(folderPath, '音频剪辑');
  const hasClips = fs.existsSync(audioClipDir);
  
  if (hasClips) {
    const clips = fs.readdirSync(audioClipDir).filter(f => f.endsWith('.mp3')).sort();
    const targetDir = path.join(AUDIO_TARGET, id);
    fs.mkdirSync(targetDir, { recursive: true });
    
    clips.forEach((f, i) => {
      fs.copyFileSync(path.join(audioClipDir, f), path.join(targetDir, `${i + 1}.mp3`));
    });
    
    // 绑定分句音频
    sentences.forEach((s, i) => {
      if (i < clips.length) {
        s.audioFile = `audio/${id}/${i + 1}.mp3`;
      }
    });
    
    console.log(`  ✅ ${title}: ${sentences.length}句, ${clips.length}个音频切片`);
  } else {
    // 查找整篇音频
    const mainMp3 = files.find(f => f.endsWith('.mp3'));
    if (mainMp3) {
      const targetDir = path.join(AUDIO_TARGET, id);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(path.join(folderPath, mainMp3), path.join(targetDir, 'full.mp3'));
    }
    console.log(`  📄 ${title}: ${sentences.length}句 (无分句音频)`);
  }
  
  // 解析作者
  let authorName = '佚名';
  let dynasty = '不详';
  if (author) {
    const authorMatch = author.match(/(.+?)\s*〔(.+?)〕/);
    if (authorMatch) {
      authorName = authorMatch[1].trim();
      dynasty = authorMatch[2].replace('代', '');
    } else {
      authorName = author.replace(/[〔〕\[\]]/g, '').trim();
    }
  }
  
  // 读取重点字词 Excel
  const keywordFile = files.find(f => f.startsWith('重点字词导入模板') && f.endsWith('.xlsx'));
  const keywords = [];
  if (keywordFile) {
    const kwb = XLSX.readFile(path.join(folderPath, keywordFile));
    const ksheet = kwb.Sheets[kwb.SheetNames[0]];
    const krows = XLSX.utils.sheet_to_json(ksheet, { header: 1 });
    
    for (const row of krows) {
      if (!row[0] || row[0] === '字词') continue;
      const word = String(row[0]).trim();
      if (!word || word.length < 1) continue;
      const pinyin = row[1] ? String(row[1]).trim() : undefined;
      const meaning = row[2] ? String(row[2]).trim() : '';
      const context = row[4] ? String(row[4]).trim() : undefined;
      if (meaning) {
        keywords.push({ word, pinyin, meaning, context });
      }
    }
  }

  const kwCount = keywords.length;

  return {
    id,
    title,
    author: authorName,
    dynasty,
    source: '部编版课文',
    grade,
    semester,
    category,
    audioFile: hasClips ? `audio/${id}/full.mp3` : `audio/${id}/full.mp3`,
    sentences,
    ...(kwCount > 0 ? { keywords } : {})
  };
}

// === 主流程 ===
console.log('🚀 开始批量导入...\n');

const allPoems = [];
// 初中目录结构: 初一(上)/文言文/篇目, 初一(上)/诗词/篇目...
const gradeDirs = fs.readdirSync(ROOT).filter(f => f.startsWith('初'));

for (const gradeDir of gradeDirs) {
  const gradePath = path.join(ROOT, gradeDir);
  const catDirs = fs.readdirSync(gradePath).filter(f => {
    const fullPath = path.join(gradePath, f);
    return fs.statSync(fullPath).isDirectory();
  });
  
  for (const catDir of catDirs) {
    const catPath = path.join(gradePath, catDir);
    console.log(`\n📂 ${gradeDir} / ${catDir}`);
    
    const poemDirs = fs.readdirSync(catPath).filter(f =>
      fs.statSync(path.join(catPath, f)).isDirectory()
    );
    
    for (const poemDir of poemDirs) {
      const poemPath = path.join(catPath, poemDir);
      const poem = processFolder(poemPath, gradeDir, catDir);
      if (poem) allPoems.push(poem);
    }
  }
}

// 写入 poems.json
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allPoems, null, 2), 'utf8');

console.log(`\n🎉 完成！共导入 ${allPoems.length} 个篇目`);
console.log(`📄 数据已写入: ${OUTPUT_JSON}`);
console.log(`🔊 音频已拷贝至: ${AUDIO_TARGET}`);
