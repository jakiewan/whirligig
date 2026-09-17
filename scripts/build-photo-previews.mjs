// 把 18 张原图统一转成 2K AVIF q70,直接输出到 public/photos/XX.avif。
// 不再有"预览 vs 原图"两层 —— 相框和 viewer 弹窗都用同一张高清 AVIF。
// 输入源固定为 work/photos-orig/(原图备份),按文件名排序后逐张输出。
import sharp from 'sharp';
import { readFile, mkdir, stat, readdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const srcDir = new URL('work/photos-orig/', root);
const outDir = new URL('public/photos/', root);
await mkdir(outDir, { recursive: true });
let files = (await readdir(srcDir)).filter(f => /\.(jpe?g|png|heic)$/i.test(f)).sort();
let originalBytes = 0, previewBytes = 0;
for (const [i, name] of files.entries()) {
  const input = new URL(encodeURIComponent(name), srcDir);
  const output = new URL(`${String(i+1).padStart(2,'0')}.avif`, outDir);
  await sharp(await readFile(input)).rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).avif({ quality: 70, effort: 6, chromaSubsampling: '4:4:4' }).toFile(output.pathname);
  originalBytes += (await stat(input)).size;
  previewBytes += (await stat(output)).size;
}
console.log(JSON.stringify({ images: files.length, originalBytes, previewBytes, reduction: 1 - previewBytes / originalBytes, perImageKB: Math.round(previewBytes / files.length / 1024) }));
