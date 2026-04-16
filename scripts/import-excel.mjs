/**
 * 从 Excel 导入模板读取原文+翻译，拷贝音频到项目
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = "D:\\二三言\\小学1-6\\按年级分类\\小学3年级\\文言文-3上\\04 小学文言文·小古文·中华经典寓言故事《司马光救友》（课本《司马光》）\\语句导入模板_《司马光》.xlsx";
const AUDIO_DIR = "D:\\二三言\\小学1-6\\按年级分类\\小学3年级\\文言文-3上\\04 小学文言文·小古文·中华经典寓言故事《司马光救友》（课本《司马光》）\\音频剪辑";
const TARGET_AUDIO_DIR = path.resolve("./public/audio/simaguang");

// 1. 读取 Excel
const workbook = XLSX.readFile(EXCEL_PATH);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("=== Excel 原始数据 ===");
data.forEach((row, i) => console.log(`Row ${i}: ${JSON.stringify(row)}`));

// 2. 读取音频文件列表
const audioFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3')).sort();
console.log("\n=== 音频文件列表 ===");
audioFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

// 3. 拷贝音频到项目
fs.mkdirSync(TARGET_AUDIO_DIR, { recursive: true });
audioFiles.forEach((f, i) => {
  const src = path.join(AUDIO_DIR, f);
  const dest = path.join(TARGET_AUDIO_DIR, `${i + 1}.mp3`);
  fs.copyFileSync(src, dest);
  console.log(`  拷贝: ${f} -> ${i + 1}.mp3`);
});

console.log("\n✅ 完成！音频已拷贝到", TARGET_AUDIO_DIR);
