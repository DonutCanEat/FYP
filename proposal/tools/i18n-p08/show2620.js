const fs=require('fs');
const f='D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md';
const lines=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('\n');
console.log('--- L2620 (zh) ---');
console.log(lines[2619]);
console.log('');
const lines2=fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
console.log('--- L2620 (en) ---');
console.log(lines2[2619]);
