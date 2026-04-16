import json
import asyncio
import edge_tts
import os

# 配置
JSON_PATH = "../src/data/poems.json"
OUTPUT_DIR = "../public/audio"
VOICE = "zh-CN-XiaoxiaoNeural"  # 清晰的女童声/年轻女声

async def generate_audio(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)
    print(f"Generated: {output_path}")

async def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        poems = json.load(f)

    tasks = []
    for poem in poems:
        # 拼接全文
        full_text = f"{poem['title']}。{poem['author']}。{''.join([s['text'] for s in poem['sentences']])}"
        filename = poem['audioFile'].split('/')[-1]
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        if not os.path.exists(output_path):
            tasks.append(generate_audio(full_text, output_path))
        else:
            print(f"Skipping (exists): {output_path}")

    if tasks:
        await asyncio.gather(*tasks)
    else:
        print("No new audio to generate.")

if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(main())
