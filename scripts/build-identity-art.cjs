const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'verification/independent-angle-king-2026-10-25/artwork'),output=path.join(root,'assets/images');
const bots=[['scout','삼각봇'],['prism','프리즘봇'],['orbit','궤도봇'],['maker','공작봇'],['spark','번개봇'],['relay','통신봇'],['comet','혜성봇'],['polar','빙하봇'],['captain','대장봇'],['nova','새별봇']];
const tools=['bazooka','grenade','sacred','rope','sheep','dynamite','mine','punch','teleport','jetpack'];
async function exportAtlas(file,entries,character){
 const input=path.join(source,file),{width,height}=await sharp(input).metadata(),results=[];
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<entries.length;i++){
  const col=i%5,row=Math.floor(i/5),left=Math.floor(col*width/5),right=Math.floor((col+1)*width/5),top=Math.floor(row*height/2),bottom=Math.floor((row+1)*height/2);
  let x0=right,y0=bottom,x1=left,y1=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x1<=x0||y1<=y0)throw Error('Empty cell '+i+' in '+file);
  const box={left:x0,top:y0,width:x1-x0+1,height:y1-y0+1},id=character?entries[i][0]:entries[i],name=character?entries[i][1]:null,dest=(character?'bot-':'tool-')+id+'.png';
  const result=await sharp(input).extract(box).resize(character?{height:384,withoutEnlargement:true}:{width:256,height:256,fit:'inside',withoutEnlargement:true}).png().toBuffer();fs.writeFileSync(path.join(output,dest),result);
  const m=await sharp(result).metadata();results.push({id,...(name?{name}:{}),file:dest,width:m.width,height:m.height,bounds:{x:0,y:0,w:m.width,h:m.height},source:'project-generated '+file,sourceCell:i,sourceCrop:box});
 }
 return results;
}
(async()=>{
 const characters=await exportAtlas('angle-bots-atlas.png',bots,true),icons=Object.fromEntries((await exportAtlas('angle-tools-atlas.png',tools,false)).map(e=>[e.id,e]));
 const manifestFile=path.join(root,'assets/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));manifest.characters=characters;manifest.icons=icons;fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 const graphics=path.join(root,'src/graphics.js');let text=fs.readFileSync(graphics,'utf8');text=text.replace(/const ART_MANIFEST=.*?;\r?\nconst artImages/,()=> 'const ART_MANIFEST='+JSON.stringify(manifest)+';\nconst artImages');fs.writeFileSync(graphics,text);
 fs.writeFileSync(path.join(source,'exports.json'),JSON.stringify({method:'Deterministic alpha bounds, cell extraction and size export from imagegen atlases; no repainting',characters,icons},null,2));
 const master=path.join(source,'app-icon-master.png');if(fs.existsSync(master))for(const [file,size]of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512]])await sharp(master).resize(size,size).png().toFile(path.join(root,'icons',file));
 console.log('Exported ten new robot characters and ten new tool icons');
})().catch(e=>{console.error(e);process.exitCode=1});
