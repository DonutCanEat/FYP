const fs=require('fs');
const en='D:/File/School/FYP/proposal/sections/08-project-management.md';
const zh='D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md';
function occ(file,pat){
  const lines=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').split('\n');
  const out=[];
  lines.forEach((l,i)=>{ const m=l.match(pat); if(m) out.push({line:i+1,count:m.length,text:l.slice(0,110)}); });
  return out;
}
console.log('EN VLAN 999:'); occ(en,/VLAN 999/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
console.log('ZH VLAN 999:'); occ(zh,/VLAN 999/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
console.log('EN PR-01:'); occ(en,/PR-01/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
console.log('ZH PR-01:'); occ(zh,/PR-01/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
console.log('EN PR-010:'); occ(en,/PR-010/g).forEach(x=>console.log('  L'+x.line+' x'+x.count));
console.log('ZH PR-010:'); occ(zh,/PR-010/g).forEach(x=>console.log('  L'+x.line+' x'+x.count));
console.log('EN Appendix A/C/F/G:'); occ(en,/Appendix [ACFG]\b/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
console.log('ZH Appendix A/C/F/G:'); occ(zh,/Appendix [ACFG]\b/g).forEach(x=>console.log('  L'+x.line+' x'+x.count+': '+x.text));
