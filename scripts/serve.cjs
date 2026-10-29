const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  if(!/^(index\.html|manifest\.webmanifest|sw\.js|ys-(?:install|qr)\.js|qr\.svg|og-image\.jpg|og-image-angle-king\.png|og-image-angle-bots\.png|icons\/[a-z0-9-]+\.png|styles\/game\.css|src\/[a-z]+\.js|assets\/audio\/[a-z-]+\.mp3|assets\/images\/[a-z-]+\.png|dist\/wormfront-stage[0-9]+-offline\.html)$/.test(relative)){res.writeHead(404);res.end();return}
  const file=path.join(root,relative);if(!fs.existsSync(file)){res.writeHead(404);res.end();return}
  const type=require('./mime.cjs')(file);
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
}).listen(4187,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4187'));
