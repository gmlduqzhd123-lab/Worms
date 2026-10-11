const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  if(!/^(index\.html|styles\/game\.css|src\/[a-z]+\.js|assets\/images\/[a-z-]+\.png|dist\/wormfront-stage[456789]-offline\.html)$/.test(relative)){res.writeHead(404);res.end();return}
  const file=path.join(root,relative);if(!fs.existsSync(file)){res.writeHead(404);res.end();return}
  const type=file.endsWith('.png')?'image/png':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
}).listen(4187,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4187'));
