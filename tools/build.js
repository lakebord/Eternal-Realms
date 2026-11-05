// Concatenates src/ into a single self-contained page.
// dist/eternal-realms.html : body content for the claude.ai artifact (the host adds <!doctype>, <head>, <body>)
// index.html               : standalone page for any static host (GitHub Pages, itch.io, local file)
const fs=require('fs'),path=require('path');const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=['data','expansion','classes2','engine','sim','player','combat','chat','chat2','events','net','art','audio','music','fx','ui','ui2','finale','cutscene'].map(f=>`/* ---- ${f}.js ---- */\n`+R(`src/${f}.js`)).join('\n');
const page=R('src/shell.html').replace('/*__CSS__*/',()=>R('src/style.css')).replace('/*__JS__*/',()=>js);
fs.mkdirSync(path.join(__dirname,'../dist'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'../dist/eternal-realms.html'),page);
const standalone=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head><body>\n${page}\n</body></html>\n`;
fs.writeFileSync(path.join(__dirname,'../index.html'),standalone);
console.log('built',(page.length/1024).toFixed(0)+'KB');
