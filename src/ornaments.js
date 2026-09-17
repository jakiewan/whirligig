import * as T from 'three';

// 彩绘纹样使用高分辨率纹理，近景保留线条与花瓣细节。
function painting(background, flowers = true) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
  const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,1024,1536);
  const gold='#a18b4b',green='#3e613e';c.lineCap='round';
  c.strokeStyle=gold;c.lineWidth=12;c.strokeRect(35,30,954,1476);
  c.lineWidth=3;c.strokeRect(52,47,920,1442);
  c.beginPath();c.moveTo(110,1430);c.lineTo(110,400);c.bezierCurveTo(100,230,360,110,512,105);c.bezierCurveTo(680,110,935,240,914,400);c.lineTo(914,1430);c.stroke();
  function leaf(x,y,side,scale=1){c.save();c.translate(x,y);c.scale(side*scale,scale);c.fillStyle=green;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(70,-110,210,-90,200,-155);c.bezierCurveTo(65,-185,20,-100,0,0);c.fill();c.strokeStyle='#9da166';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(170,-140);c.stroke();c.restore();}
  c.strokeStyle=green;c.lineWidth=11;c.beginPath();c.moveTo(512,1310);c.bezierCurveTo(460,960,565,680,512,430);c.stroke();
  for(let j=0;j<5;j++){leaf(512,1230-j*135,j%2?1:-1,.72);leaf(512,1180-j*135,j%2?-1:1,.55);}
  const colors=flowers?['#983b39','#bf6253','#e0ae71']:['#b29239','#d1ac50','#f2d185'];
  for(let j=0;j<9;j++){c.save();c.translate(512,410);c.rotate(j*Math.PI*2/9);c.fillStyle=colors[j%3];c.beginPath();c.ellipse(0,-72,45,100,0,0,Math.PI*2);c.fill();c.strokeStyle='#d5b878';c.lineWidth=2;c.stroke();c.restore();}c.fillStyle='#dab14e';c.beginPath();c.arc(512,410,38,0,Math.PI*2);c.fill();
  for(let j=0;j<7;j++){for(const side of [-1,1]){c.fillStyle=j%2?green:gold;c.beginPath();c.ellipse(512+side*(75+j*47),165+j*12,12,24,side*.8,0,Math.PI*2);c.fill();}}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=16;return tex;
}

export function refineModel(root,materials){
 const {gold,ivory,teal,plum}=materials;
 const meshes=[];const add=(geo,mat,pos,parent=root)=>{const o=new T.Mesh(geo,mat);o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);meshes.push(o);return o};
 const mat=(color,metalness=.15,roughness=.4)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const red=mat('#883a34'),blue=mat('#456c7e'),green=mat('#294f3d'),ochre=mat('#c49a4b');
 const sphere=(p,s,m,parent=root)=>{const o=add(new T.SphereGeometry(1,24,16),m,p,parent);o.scale.set(...s);return o};
 const tube=(points,r,m,parent=root)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),m,[0,0,0],parent);
 const ring=(r,y,thickness,m=gold)=>{const o=add(new T.TorusGeometry(r,thickness,12,128),m,[0,y,0]);o.rotation.x=Math.PI/2;return o};
 // 替换原先光滑的冠圈与螺旋立柱，保留相片和控制结构。
 for(const o of [...root.children]){
   const g=o.geometry,p=g?.parameters;
   if(g?.type==='TubeGeometry'||(g?.type==='CylinderGeometry'&&((o.position.y>4.4&&o.position.y<5.5)||(o.position.y>2.5&&o.position.y<2.7))))root.remove(o);
   if(o.isGroup&&o.position.y===4.55)root.remove(o);
   if(g?.type==='SphereGeometry'&&o.position.y===.28)root.remove(o);
   if((g?.type==='TorusGeometry'&&o.position.y===4.68)||o.position.y>5.5)root.remove(o);
 }
 const floral=[painting('#e4dfbd'),painting('#e9dfbf',false),painting('#94aaa0'),painting('#c99a50',false)];
 const painted=floral.map(map=>new T.MeshStandardMaterial({map,roughness:.52,metalness:.06}));
 // 蓝白交替的低矮伞顶。
 for(let i=0;i<16;i++){const o=add(new T.ConeGeometry(2.12,.88,12,1,false,i*Math.PI/8,Math.PI/8),i%2?ivory:blue,[0,5.08,0]);o.geometry.computeVertexNormals();const a=i*Math.PI/8;tube([[.01,5.52,0],[1.06*Math.sin(a),5.1,1.06*Math.cos(a)],[2.13*Math.sin(a),4.64,2.13*Math.cos(a)]],.016,gold);}
 // 十六块拱形彩绘围板；正反两面均有纹样。
 for(let i=0;i<16;i++){
   const a=i*Math.PI/8,w=.81,h=.49;const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h*.62);shape.bezierCurveTo(w*.3,h*.75,w*.2,h,0,h);shape.bezierCurveTo(-w*.2,h,-w*.3,h*.75,-w/2,h*.62);shape.closePath();
   const geo=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.012,bevelThickness:.008,curveSegments:24});
   // 展开面的 UV 映射保证纹样不被默认空间坐标截断。
   const pos=geo.attributes.position,uv=geo.attributes.uv;for(let n=0;n<pos.count;n++)uv.setXY(n,(pos.getX(n)+w/2)/w,pos.getY(n)/h);uv.needsUpdate=true;
   const panel=add(geo,painted[i%2],[Math.sin(a)*2.08,4.44,Math.cos(a)*2.08]);panel.rotation.y=a;
   const trim=shape.getPoints(40).map(p=>[p.x,p.y,.055]);const group=new T.Group();group.position.copy(panel.position);group.rotation.copy(panel.rotation);root.add(group);tube(trim,.012,gold,group);
 }
 ring(2.12,4.43,.038,red);ring(2.13,4.46,.015);sphere([0,5.65,0],[.11,.16,.11],red);
 for(let i=0;i<5;i++){const y=1.02+i*.66;const cm=painted[[2,0,3,2,0][i]].clone();cm.map=cm.map.clone();cm.map.wrapS=T.RepeatWrapping;cm.map.repeat.x=6;cm.map.needsUpdate=true;add(new T.CylinderGeometry(.33,.37,.65,96),cm,[0,y+.325,0]);ring(.373,y,.028);}
 add(new T.CylinderGeometry(.52,.57,.38,64),painted[2],[0,.83,0]);
 // 底座的交替花卉饰牌。
 for(let i=0;i<24;i++){const a=i*Math.PI/12;const group=new T.Group();group.position.set(Math.sin(a)*2.047,.28,Math.cos(a)*2.047);group.rotation.y=a;root.add(group);const panel=add(new T.PlaneGeometry(.49,.245),painted[i%2],[0,0,.012],group);panel.material=panel.material.clone();panel.material.side=T.DoubleSide;}
 for(const o of root.children)if(o.geometry?.type==='CylinderGeometry'&&o.position.y===.56)o.material=ochre;
 // 木马补足鞍毯、缰绳、鬃毛、关节和蹄子，避免纯白玩具块面。
 const horses=root.children.filter(o=>o.isGroup&&Math.abs(o.position.y-.99)<.001);
 horses.forEach((horse,i)=>{
   const saddle=[red,teal,blue,plum][i];sphere([-.05,.405,0],[.24,.09,.19],saddle,horse);
   for(const side of [-1,1]){sphere([-.06,.28,side*.17],[.2,.16,.025],saddle,horse);tube([[-.22,.38,side*.18],[-.05,.13,side*.195],[.12,.37,side*.18]],.012,gold,horse);tube([[.48,.68,side*.11],[.28,.67,side*.13],[.16,.45,side*.18],[-.03,.48,side*.18]],.012,red,horse);sphere([.44,.66,side*.09],[.012,.013,.014],plum,horse);for(let k=0;k<5;k++)sphere([-.19+k*.065,.22,side*.2],[.017,.024,.013],gold,horse);}
   for(let j=0;j<10;j++)sphere([.13-j*.009,.79-j*.045,0],[.055,.036,.13],j%2?gold:ochre,horse);
 });
 // 底盘上的立体花叶装饰。
 for(let i=0;i<10;i++){const a=i*Math.PI/5+.18,x=Math.sin(a)*1.76,z=Math.cos(a)*1.76;for(let j=0;j<5;j++){const b=j*Math.PI*2/5;const petal=sphere([x+Math.sin(b)*.075,.69,z+Math.cos(b)*.075],[.064,.019,.034],i%2?ivory:red);petal.rotation.y=-b;}sphere([x,.715,z],[.028,.025,.028],gold);for(const side of [-1,1]){const leaf=sphere([x+side*.14,.67,z+.055],[.115,.018,.04],green);leaf.rotation.y=side*.65;}}
 // 参考中底盘明显小于冠顶。
 for(const o of root.children){if(o.position.y<.72&&o.type!=='PointLight'){o.position.x*=.79;o.position.z*=.79;o.scale.x*=.79;if(o.geometry?.type==='TorusGeometry')o.scale.y*=.79;else o.scale.z*=.79;}}
 horses.forEach(h=>{h.position.x*=.86;h.position.z*=.86;h.scale.setScalar(.93)});
 return {horses,materials:[...painted,red,blue,green,ochre]};
}
