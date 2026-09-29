const fs = require('fs');
const dir = 'D:/File/School/FYP/proposal/tools/i18n-w6-auto';
const zl = fs.readFileSync(dir + '/zh/w08.txt', 'utf8').split('\n');
const i = zl.findIndex(l => l === '%%U0442%%');
const body = [];
let j = i + 1;
while (j < zl.length && !/^%%U\d{4}%%$/.test(zl[j])) { body.push(zl[j]); j++; }
while (body.length && body[body.length - 1] === '') body.pop();
const s = body.join('\n');
const re = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;
let m, n = 0;
while ((m = re.exec(s)) !== null) { n++; console.log(n + ': ' + JSON.stringify(m[0]) + ' at ' + m.index + ' lastIndex=' + re.lastIndex); }
console.log('total ' + n);
body.forEach((l, k) => console.log('L' + k + ': ' + JSON.stringify(l)));
