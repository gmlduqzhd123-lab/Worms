const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
const env={...process.env,WORMFRONT_QA_DIR:out,WORMFRONT_BROWSER_CHANNEL:process.env.WORMFRONT_BROWSER_CHANNEL||'chromium'};
const runs=[];
for(const file of ['check-source.cjs','verify-fixes.cjs','verify-gameplay-safety.cjs','verify-sfx.cjs','verify-built.cjs']){
  console.log('\nRunning '+file);
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,env,stdio:'inherit',timeout:180000});
  runs.push({file,passed:!result.error&&result.status===0,error:result.error?.message,status:result.status});
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({runs},null,2));
  if(result.error)console.error(result.error.message);
  if(result.error||result.status!==0){process.exitCode=1;break}
}
