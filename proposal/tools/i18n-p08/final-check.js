const fs=require('fs');
const zh=fs.readFileSync('D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
const en=fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').replace(/\r\n/g,'\n').split('\n');
const re=/\bPR-01\b/g;
[1198,1223,1229,2620].forEach(n=>{ console.log('L'+n+' en='+((en[n-1].match(re)||[]).length)+' zh='+((zh[n-1].match(re)||[]).length)); });
console.log('L608 VLAN999 en='+((en[607].match(/VLAN 999/g)||[]).length)+' zh='+((zh[607].match(/VLAN 999/g)||[]).length));
console.log('total PR-01 en='+((fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').match(re)||[]).length)+' zh='+((fs.readFileSync('D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md','utf8').match(re)||[]).length));
console.log('total VLAN 999 en='+((fs.readFileSync('D:/File/School/FYP/proposal/sections/08-project-management.md','utf8').match(/VLAN 999/g)||[]).length)+' zh='+((fs.readFileSync('D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md','utf8').match(/VLAN 999/g)||[]).length));
