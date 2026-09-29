const fs=require('fs');
const lines=fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
const out=[];
[1521,1523].forEach(n=>{
  const t=lines[n-1];
  const i=t.indexOf('(line truncated');
  out.push('=== line '+n+' totalLen='+t.length+' markerAt='+i+' ===');
  out.push('TAIL_180_BEFORE_MARKER: '+JSON.stringify(t.slice(Math.max(0,i-180), i)));
  out.push('SLICE_1400_2000: '+JSON.stringify(t.slice(1400,2000)));
});
fs.writeFileSync('D:/File/School/FYP/proposal/tools/i18n-p08/trunc.txt', out.join('\n\n'), 'utf8');
console.log('ok');
