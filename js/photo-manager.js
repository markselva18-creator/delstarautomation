'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const encoder = new TextEncoder();
 let documentSource = null, projects = [], files = new Map(), objectURLs = [];
 const safe = s => s.replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90);
 const status = msg => { $('status').textContent = msg; };
 const parseImages = card => {try {const a=JSON.parse(card.getAttribute('data-images')||'[]');if(Array.isArray(a))return a.filter(x=>typeof x==='string'&&x.trim()).map(path=>({path}));}catch{}const src=card.querySelector('.project-thumb img')?.getAttribute('src');return src?[{path:src}]:[];};
 $('htmlFile').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const raw=await file.text();if(!raw.includes('project-card'))throw Error('This does not appear to be the DelStar projects page.');
   documentSource=new DOMParser().parseFromString(raw,'text/html');
   projects=[...documentSource.querySelectorAll('.project-card')].map((card,i)=>({card,index:i,title:card.querySelector('h3')?.textContent?.trim()||`Project ${i+1}`,images:parseImages(card)}));
   files.clear();objectURLs.forEach(URL.revokeObjectURL);objectURLs=[];
   $('projectSelect').replaceChildren(...projects.map((p,i)=>new Option(`${i+1}. ${p.title}`,String(i))));
   $('editor').hidden=false;status(`Loaded ${projects.length} project tiles. Select a project and manage its photos.`);render();
  }catch(err){status('Unable to load: '+err.message);$('editor').hidden=true;}
 });
 $('projectSelect').addEventListener('change',render);
 $('addPhotos').addEventListener('change',async e=>{
  const p=projects[Number($('projectSelect').value)];if(!p)return;
  for(const file of e.target.files){if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){status('Skipped unsupported file: '+file.name);continue;}
   const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
   const stem=safe(p.title)||`project_${p.index+1}`;
   let path, n=1;do{path=`images/gallery_${stem}_${String(n++).padStart(3,'0')}.${ext}`;}while(files.has(path)||projects.some(project=>project.images.some(im=>im.path===path)));
   files.set(path,file);const url=URL.createObjectURL(file);objectURLs.push(url);p.images.push({path,url});
  }e.target.value='';render();status(`Gallery now has ${p.images.length} photo(s). Export to save changes.`);
 });
 function render(){const p=projects[Number($('projectSelect').value)];if(!p)return;const area=$('photos');area.replaceChildren();
  if(!p.images.length){const el=document.createElement('p');el.className='empty';el.textContent='No photos yet. Add photographs above.';area.append(el);return;}
  p.images.forEach((item,i)=>{
   const card=document.createElement('article');card.className='photo';const img=document.createElement('img');img.src=item.url||item.path;img.alt=`${p.title} photo ${i+1}`;
   const name=document.createElement('p');name.className='name';name.textContent=item.path.split('/').pop();
   const cover=document.createElement('div');cover.className='cover';cover.textContent=i===0?'★ Tile cover photo':`Photo ${i+1}`;
   const actions=document.createElement('div');actions.className='actions';
   for(const [label,delta] of [['←',-1],['→',1]]){const b=document.createElement('button');b.textContent=label;b.title=delta===-1?'Move earlier':'Move later';b.disabled=i+delta<0||i+delta>=p.images.length;b.addEventListener('click',()=>{[p.images[i],p.images[i+delta]]=[p.images[i+delta],p.images[i]];render();});actions.append(b);}
   const del=document.createElement('button');del.textContent='Remove';del.addEventListener('click',()=>{p.images.splice(i,1);render();});actions.append(del);
   card.append(img,cover,name,actions);area.append(card);
  });
 }
 // ZIP writer (uncompressed ZIP, browser-native, no third-party library or network dependency).
 const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 function zip(entries){const chunks=[],central=[];let offset=0;const u16=(v,o,n)=>{o.setUint16(n,v,true);},u32=(v,o,n)=>{o.setUint32(n,v>>>0,true);};
  for(const [path,data] of entries){const name=encoder.encode(path),crc=crc32(data);const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);u32(0x04034b50,v,0);u16(20,v,4);u16(0x0800,v,6);u16(0,v,8);u32(crc,v,14);u32(data.length,v,18);u32(data.length,v,22);u16(name.length,v,26);header.set(name,30);chunks.push(header,data);
   const ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);u32(0x02014b50,cv,0);u16(20,cv,4);u16(20,cv,6);u16(0x0800,cv,8);u32(crc,cv,16);u32(data.length,cv,20);u32(data.length,cv,24);u16(name.length,cv,28);u32(offset,cv,42);ch.set(name,46);central.push(ch);offset+=header.length+data.length;
  }const cdSize=central.reduce((n,a)=>n+a.length,0);const end=new Uint8Array(22),v=new DataView(end.buffer);u32(0x06054b50,v,0);u16(entries.length,v,8);u16(entries.length,v,10);u32(cdSize,v,12);u32(offset,v,16);return new Blob([...chunks,...central,end],{type:'application/zip'});
 }
 $('saveZip').addEventListener('click',async()=>{
  if(!documentSource)return;
  try{
   for(const p of projects){const paths=p.images.map(x=>x.path);p.card.setAttribute('data-images',JSON.stringify(paths));const cover=p.card.querySelector('.project-thumb img');if(cover&&paths.length)cover.setAttribute('src',paths[0]);}
   const html='<!DOCTYPE html>\n'+documentSource.documentElement.outerHTML;
   const entries=[['projects.html',encoder.encode(html)]];
   const active=new Set(projects.flatMap(p=>p.images.map(x=>x.path)));
   for(const [path,file] of files)if(active.has(path))entries.push([path,new Uint8Array(await file.arrayBuffer())]);
   const blob=zip(entries),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='DelStar_Gallery_Changes.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   status(`Exported projects.html and ${entries.length-1} new image(s). Extract into the website folder to apply.`);
  }catch(err){status('Export failed: '+err.message);}
 });
})();
