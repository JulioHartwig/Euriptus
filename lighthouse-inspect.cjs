const fs=require('fs');
const audit=JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode-browser-b1LC9s/0/lighthouse.json','utf8'));
console.log(JSON.stringify(audit.audits['heading-order'].details?.items,null,2));
