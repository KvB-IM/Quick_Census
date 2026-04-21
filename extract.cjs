const fs = require('fs');

const content = fs.readFileSync('Rapid Census v1313.html', 'utf8');
const lines = content.split('\n');

const styleLines = lines.slice(39, 316);
const jsLines = lines.slice(820, 3447);

fs.mkdirSync('src', { recursive: true });
fs.writeFileSync('src/style.css', styleLines.join('\n'));
fs.writeFileSync('src/main.js', jsLines.join('\n'));

// Now replace in index.html
let newHtmlLines = [];
let i = 0;
while (i < lines.length) {
    if (i === 38) { // line 39 is <style>
        newHtmlLines.push('    <link rel="stylesheet" href="/src/style.css">');
        i = 317; // skip to after </style>
        continue;
    }
    if (i === 819) { // line 820 is <script>
        newHtmlLines.push('    <script type="module" src="/src/main.js"></script>');
        i = 3448; // skip to after </script>
        continue;
    }
    newHtmlLines.push(lines[i]);
    i++;
}

fs.writeFileSync('index.html', newHtmlLines.join('\n'));
