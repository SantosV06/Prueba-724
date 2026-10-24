"""Rebuild web delivery assets; requires ffmpeg and Pillow locally, never at deploy."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, subprocess
from PIL import Image
root = Path(__file__).resolve().parent.parent
source = root / 'public/assets/img'
out = root / 'media-optimized'
out.mkdir(exist_ok=True)
files = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', 'import {mediaFiles} from "./src/data/media-files.mjs"; console.log(JSON.stringify(mediaFiles))'], cwd=root))
def encode(item):
    key, name = item
    original = source / name
    if name.endswith('.mp4'):
        target = out / f'{key}.mp4'
        poster = out / f'{key}-poster.jpg'
        if not original.exists():
            if target.exists() and poster.exists():
                print(f'{key}: retained existing derivatives (source removed)', flush=True)
                return
            raise FileNotFoundError(f'Missing source and optimized video derivatives for {key}: {original}')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(original), '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2', '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '2', str(target)], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '0.5', '-i', str(original), '-frames:v', '1', '-vf', 'scale=960:-2', '-q:v', '4', str(out / f'{key}-poster.jpg')], check=True)
    elif name.endswith('.png'):
        target = out / f'{key}.webp'
        if not original.exists():
            if target.exists():
                print(f'{key}: retained existing derivative (source removed)', flush=True)
                return
            raise FileNotFoundError(f'Missing source and optimized image derivative for {key}: {original}')
        image = Image.open(original).convert('RGBA')
        image.thumbnail((1600, 1600))
        image.save(out / f'{key}.webp', 'WEBP', quality=85, method=6)
    else: return
    print(key, flush=True)
with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(encode, files.items()))
