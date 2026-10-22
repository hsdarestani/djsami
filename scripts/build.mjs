import { mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Fonts come from installed OFL-licensed packages, served by our own domain.
// We use the Latin subset, which includes German ä, ö, ü and ß.
const files=['index.html','styles.css','app.js','favicon.svg','_headers','robots.txt','privacy.html','imprint.html','admin/index.html'];
const fonts=[
  ['node_modules/@fontsource-variable/syne/files/syne-latin-wght-normal.woff2','fonts/syne-latin-variable.woff2'],
  ['node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2','fonts/manrope-latin-variable.woff2']
];
rmSync('dist',{recursive:true,force:true});
for(const [source,destination] of [...files.map(path=>[path,path]),...fonts]){
  const output=join('dist',destination);
  mkdirSync(dirname(output),{recursive:true});
  copyFileSync(source,output);
  if(destination.endsWith('.woff2') && statSync(output).size < 10000)throw new Error('Font seems incomplete: '+destination);
}
console.log('DJ SAMI – Cloudflare Pages build with self-hosted typography completed.');
