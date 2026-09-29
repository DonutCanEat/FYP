const fs=require('fs');
const dir='D:/File/School/FYP/proposal/tools/i18n-p08/zh';
const src='D:/File/School/FYP/proposal/sections/08-project-management.md';
const lines=fs.readFileSync(src,'utf8').replace(/\r\n/g,'\n').split('\n');
for(const f of fs.readdirSync(dir).filter(x=>/^batch-\d+\.md$/.test(x)).sort()){
  const raw=fs.readFileSync(dir+'/'+f,'utf8').replace(/\r\n/g,'\n');
  const re=/@@@SEG (\d+) SRC (\d+)-(\d+) LINES (\d+)@@@\n([\s\S]*?)\n@@@ENDSEG \1@@@/g;
  let m;
  while((m=re.exec(raw))!==null){
    const ls=+m[2], le=+m[3], ln=+m[4];
    const body=m[5].split('\n');
    const srcSlice=lines.slice(ls-1, le);
    if(body.length!==ln || srcSlice.length!==ln){
      console.log(f+' seg'+m[1]+' SRC '+ls+'-'+le+' declared '+ln+' body='+body.length+' srcSlice='+srcSlice.length);
      for(let i=0;i<Math.max(body.length, ln);i++){
        const b=(body[i]===undefined?'(MISSING)':body[i]).slice(0,90);
        console.log('  '+String(i).padStart(3)+' SRC:'+(srcSlice[i]||'').slice(0,90));
        console.log('      ZH :'+b);
      }
    }
  }
}
