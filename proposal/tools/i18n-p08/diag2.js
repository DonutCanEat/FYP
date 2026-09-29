const fs=require('fs');
const dir='D:/File/School/FYP/proposal/tools/i18n-p08/zh';
const src='D:/File/School/FYP/proposal/sections/08-project-management.md';
const lines=fs.readFileSync(src,'utf8').replace(/\r\n/g,'\n').split('\n');
const f='batch-08.md';
const raw=fs.readFileSync(dir+'/'+f,'utf8').replace(/\r\n/g,'\n');
const re=/@@@SEG (\d+) SRC (\d+)-(\d+) LINES (\d+)@@@\n([\s\S]*?)\n@@@ENDSEG \1@@@/g;
let m;
while((m=re.exec(raw))!==null){
  const ls=+m[2], le=+m[3], ln=+m[4];
  if(ln!==207) continue;
  const body=m[5].split('\n');
  const srcSlice=lines.slice(ls-1, le);
  console.log('src lines '+ls+'-'+le+' declared '+ln+' body='+body.length);
  // heuristic alignment: find where ZH stops matching structure
  let j=0;
  for(let i=0;i<srcSlice.length;i++){
    const s0=srcSlice[i];
    const z0=body[j];
    const srcBlank=s0.trim()==='';
    const zBlank=(z0===undefined)?null:(z0.trim()==='');
    if(srcBlank!==zBlank){
      console.log('DIVERGE at src index '+i+' (src line '+(ls+i)+') j='+j);
      for(let k=Math.max(0,i-4);k<Math.min(srcSlice.length, i+4);k++) console.log('  SRC['+k+']: '+JSON.stringify(srcSlice[k]).slice(0,120));
      for(let k=Math.max(0,j-4);k<Math.min(body.length, j+4);k++) console.log('  ZH ['+k+']: '+JSON.stringify(body[k]).slice(0,120));
      break;
    }
    j++;
  }
}
