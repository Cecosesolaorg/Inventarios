const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\javic\\OneDrive\\Desktop\\Nueva carpeta (5)\\contenedor';

for (let i = 1; i <= 17; i++) {
    const pasilloDir = path.join(baseDir, `pasillo${i}`);
    if (!fs.existsSync(pasilloDir)) continue;

    const htmlPath = path.join(pasilloDir, `pasillo${i}.html`);
    if (!fs.existsSync(htmlPath)) continue;

    console.log(`Adding ExcelJS to Pasillo ${i}...`);

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Replace SheetJS with ExcelJS and FileSaver
    const newScripts = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script src="pasillo.js"></script>
`;
    htmlContent = htmlContent.replace(/<script src="https:\/\/cdn\.sheetjs\.com\/xlsx-0\.20\.0\/package\/dist\/xlsx\.full\.min\.js"><\/script>\s*<script src="pasillo\.js"><\/script>/, newScripts);

    fs.writeFileSync(htmlPath, htmlContent);
}

console.log('Done!');
