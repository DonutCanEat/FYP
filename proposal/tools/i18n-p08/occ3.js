const fs=require('fs');
const zh=fs.readFileSync('D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
const en=fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
const re=/\bPR-01\b/g;
[1198,1199,1200,1201,1202,1203,1204,1205,1206,1223,1229,1233,1237,1241,1245,2619,2620].forEach(n=>{
  const a=(en[n-1].match(re)||[]).length, b=(zh[n-1].match(re)||[]).length;
  if(a||b) console.log('L'+n+' en='+a+' zh='+b);
});
