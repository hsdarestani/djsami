import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
const files = ['index.html','styles.css','app.js','favicon.svg','_headers','robots.txt','privacy.html','imprint.html','admin/index.html'];
rmSync('dist',{recursive:true,force:true});
for(const source of files){
  const destination=join('dist',source);
  mkdirSync(dirname(destination),{recursive:true});
  copyFileSync(source,destination);
}
console.log('DJ SAMI — static assets created in dist/');
