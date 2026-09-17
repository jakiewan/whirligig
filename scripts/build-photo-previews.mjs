import sharp from 'sharp';
import {readFile,mkdir,stat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('src/main.js',root),'utf8');
const names=JSON.parse(source.match(/const names=(\[[^;]+\]);/)[1]);
await mkdir(new URL('public/photo-previews/',root),{recursive:true});
let originalBytes=0,previewBytes=0;
for(const [i,name] of names.entries()){
 const input=new URL('public/photos/'+encodeURIComponent(name),root);
 const output=new URL('public/photo-previews/'+String(i+1).padStart(2,'0')+'.webp',root);
 await sharp(await readFile(input)).rotate().resize({width:1280,height:1280,fit:'inside',withoutEnlargement:true}).webp({quality:80,effort:6}).toFile(output.pathname);
 originalBytes+=(await stat(input)).size;previewBytes+=(await stat(output)).size;
}
console.log(JSON.stringify({images:names.length,originalBytes,previewBytes,reduction:1-previewBytes/originalBytes}));
