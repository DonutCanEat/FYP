const fs=require('fs');
const src='D:/File/School/FYP/proposal/sections/08-project-management.md';
const lines=fs.readFileSync(src,'utf8').replace(/\r\n/g,'\n').split('\n');
[1500,1510,1511,1512,1513].forEach(n=>{ if(lines[n-1]!==undefined) console.log('SRC line '+n+' len='+lines[n-1].length); });
// find lines containing 'line truncated'
lines.forEach((l,i)=>{ if(l.includes('line truncated')) console.log('truncation marker at line '+(i+1)); });
const big=lines.map((l,i)=>({n:i+1,len:l.length})).sort((a,b)=>b.len-a.len).slice(0,8);
console.log('longest lines: '+JSON.stringify(big));
