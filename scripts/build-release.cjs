const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),site=path.join(root,'release','site');
const order=JSON.parse(fs.readFileSync(path.join(root,'scripts','source-order.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/<script defer src="\.\/([^"]+)"><\/script>/g)].map(m=>m[1]);
if(JSON.stringify(refs)!==JSON.stringify(order))throw Error('Script order differs from source-order.json');
const version=html.match(/name="wormfront-version" content="(\d+)"/)[1];
const images=fs.existsSync(path.join(root,'assets','images'))?fs.readdirSync(path.join(root,'assets','images')).filter(f=>f.endsWith('.png')).map(f=>'assets/images/'+f):[];
const files=['index.html','.nojekyll','styles/game.css',...order,...images];
const rows=[];
for(const file of files){const data=fs.readFileSync(path.join(root,file));const dest=path.join(site,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);rows.push({file,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')})}
const offline=fs.readFileSync(path.join(root,'dist',`wormfront-stage${version}-offline.html`));
fs.mkdirSync(path.join(site,'offline'),{recursive:true});fs.writeFileSync(path.join(site,'offline','wormfront.html'),offline);rows.push({file:'offline/wormfront.html',bytes:offline.length,sha256:crypto.createHash('sha256').update(offline).digest('hex')});
fs.writeFileSync(path.join(root,'release','manifest.json'),JSON.stringify({version,files:rows},null,2));
console.log(`Prepared stage ${version}: ${rows.length} files in release/site`);
