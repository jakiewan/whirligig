import * as T from 'three';

// 同一原图共用纹理，限制并发；移动网络失败时按图片重试。
export function createPhotoLoader({anisotropy,onImage}) {
  const entries=new Map(),queue=[];let active=0;
  const status=document.querySelector('#loading');
  status.classList.add('load-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const label=document.createElement('span'),retry=document.createElement('button'),dismiss=document.createElement('button');
  retry.textContent='重试照片';dismiss.textContent='收起';status.replaceChildren(label,retry,dismiss);
  dismiss.onclick=()=>{status.hidden=true};
  const placeholder=document.createElement('canvas');placeholder.width=32;placeholder.height=40;
  const ctx=placeholder.getContext('2d');ctx.fillStyle='#d9d2c1';ctx.fillRect(0,0,32,40);ctx.strokeStyle='#a69a80';ctx.strokeRect(4,4,24,28);
  function update(){const all=[...entries.values()],loaded=all.filter(e=>e.state==='loaded').length,failed=all.filter(e=>e.state==='failed').length,pending=all.length-loaded-failed;status.hidden=all.length===0||loaded===all.length;label.textContent=pending?`照片加载中 ${loaded}/${all.length}`:`${failed} 张照片暂未加载，已加载的照片可正常浏览`;retry.hidden=failed===0;dismiss.hidden=pending>0;}
  // 并发数提到 6：GitHub Pages HTTP/2 多路复用下，6 张同时拉比 3 张省 30%+ 总耗时，不影响 18 张全部加载的行为。
  function pump(){while(active<6&&queue.length){const e=queue.shift();if(e.state!=='queued')continue;active++;e.state='loading';update();attempt(e);}}
  function enqueue(e){e.state='queued';queue.push(e);update();queueMicrotask(pump);}
  function attempt(e){
    e.attempts++;const img=new Image();img.crossOrigin='anonymous';img.decoding='async';let settled=false;
    const timeout=setTimeout(()=>finish(false),45000);
    function finish(success){if(settled)return;settled=true;clearTimeout(timeout);img.onload=img.onerror=null;active--;
      if(success){e.texture.dispose();e.texture.image=img;e.texture.needsUpdate=true;e.state='loaded';for(const cb of e.callbacks)cb(e.texture);e.callbacks=[];onImage?.();}
      else if(e.attempts<3){e.state='waiting';setTimeout(()=>enqueue(e),500*e.attempts);}
      else e.state='failed';update();pump();
    }
    img.onload=()=>finish(img.naturalWidth>0);img.onerror=()=>finish(false);
    let src=e.url;if(e.attempts>1&&!src.startsWith('blob:')&&!src.startsWith('data:')){const u=new URL(src,location.href);u.searchParams.set('photo_retry',String(e.attempts));src=u.href;}img.src=src;
  }
  retry.onclick=()=>{for(const e of entries.values())if(e.state==='failed'){e.attempts=0;enqueue(e)}};
  addEventListener('online',()=>retry.click());
  return {load(url,callback){let e=entries.get(url);if(!e){const texture=new T.Texture(placeholder);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=anisotropy;texture.needsUpdate=true;e={url,texture,callbacks:[],state:'queued',attempts:0};entries.set(url,e);enqueue(e);}if(callback){if(e.state==='loaded')queueMicrotask(()=>callback(e.texture));else e.callbacks.push(callback);}return e.texture;},stats(){return [...entries.values()].map(({url,state,attempts})=>({url,state,attempts}));}};
}
