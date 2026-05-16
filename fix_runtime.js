const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('app');
files.push(path.join('app', 'layout.tsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export const runtime = "edge";') && !content.includes("export const runtime = 'edge';")) {
        content = "export const runtime = 'edge';\n" + content;
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
