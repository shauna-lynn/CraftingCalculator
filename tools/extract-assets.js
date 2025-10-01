const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const cssDir = path.join(root, 'css');
const jsDir = path.join(root, 'js');
const cssPath = path.join(cssDir, 'style.css');
const jsPath = path.join(jsDir, 'app.js');

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function extract(){
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1) Extract first <style>...</style>
  const styleRe = /<style>([\s\S]*?)<\/style>/i;
  const styleMatch = html.match(styleRe);
  if (!styleMatch) throw new Error('No <style> block found');
  const cssContent = styleMatch[1].trim() + '\n';

  // 2) Extract the last inline <script> (without src)
  const inlineScriptRe = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let lastScriptMatch = null; let m;
  while ((m = inlineScriptRe.exec(html)) !== null) { lastScriptMatch = m; }
  if (!lastScriptMatch) throw new Error('No inline <script> block found');
  const jsContentToAppend = lastScriptMatch[1].trim() + '\n';

  // 3) Write CSS (backup existing)
  ensureDir(cssDir);
  if (fs.existsSync(cssPath)) fs.copyFileSync(cssPath, cssPath + '.bak');
  fs.writeFileSync(cssPath, cssContent, 'utf8');

  // 4) Append JS to app.js (keep existing glue at top, append the rest)
  ensureDir(jsDir);
  let existingJs = '';
  if (fs.existsSync(jsPath)) existingJs = fs.readFileSync(jsPath, 'utf8');
  const mergedJs = existingJs.trimEnd() + '\n\n' + jsContentToAppend;
  fs.writeFileSync(jsPath, mergedJs, 'utf8');

  // 5) Rewrite HTML: remove the matched <style> block and the last inline <script> block
  let newHtml = html.replace(styleRe, '');
  newHtml = newHtml.replace(lastScriptMatch[0], '');

  // Ensure we have a link to css/style.css in <head>
  if (!/href=["']css\/style\.css["']/.test(newHtml)) {
    newHtml = newHtml.replace(/<title>[^<]*<\/title>/i, (mtch) => mtch + '\n    <link rel="stylesheet" href="css/style.css">');
  }
  // Ensure we have js/app.js included once before </body>
  if (!/src=["']js\/app\.js["']/.test(newHtml)) {
    newHtml = newHtml.replace(/<script src=["']js\/sync\.js["']><\/script>/i, (mtch) => mtch + '\n    <script src="js/app.js"></script>');
  }

  fs.writeFileSync(htmlPath, newHtml, 'utf8');

  console.log('Extraction complete: inline CSS -> css/style.css, inline JS appended -> js/app.js, HTML cleaned.');
}

try {
  extract();
} catch (e) {
  console.error('Extraction failed:', e.message);
  process.exit(1);
}

