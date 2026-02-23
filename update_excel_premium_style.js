const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\javic\\OneDrive\\Desktop\\Nueva carpeta (5)\\contenedor';

for (let i = 1; i <= 17; i++) {
    const pasilloDir = path.join(baseDir, `pasillo${i}`);
    if (!fs.existsSync(pasilloDir)) continue;

    const jsPath = path.join(pasilloDir, 'pasillo.js');
    if (!fs.existsSync(jsPath)) continue;

    console.log(`Applying Premium ExcelJS Style to Pasillo ${i}...`);

    let jsContent = fs.readFileSync(jsPath, 'utf8');

    // Define the new ExcelJS Export Function
    const newExportCode = `
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.onclick = async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventario');

            // --- DECORATIVE HEADER ---
            // Row 1: Company Title
            const row1 = worksheet.getRow(1);
            row1.values = ["INVENTARIO DE VIVERES 🗃️ CECOSESOLA R.L J085030140 🗃️"];
            worksheet.mergeCells('A1:C1');
            row1.height = 30;
            row1.getCell(1).font = { name: 'Outfit', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            row1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } }; // Dark Green
            row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Row 2: Aisle Title
            const row2 = worksheet.getRow(2);
            row2.values = ["PASILLO Nº ${i} 🛒 DE FERIA DEL ESTE 🛒"];
            worksheet.mergeCells('A2:C2');
            row2.height = 25;
            row2.getCell(1).font = { name: 'Outfit', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
            row2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } }; // Medium Green
            row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Row 3: Metadata - Date
            const row3 = worksheet.getRow(3);
            row3.values = ["FECHA", "", formattedDate];
            worksheet.mergeCells('A3:B3');
            row3.getCell(1).font = { bold: true };
            row3.getCell(3).alignment = { horizontal: 'center' };

            // Row 4: Metadata - Responsable
            const row4 = worksheet.getRow(4);
            row4.values = ["RESPONSABLE DIRECTO XXXXXXXXXXXXXXXXXXXX", "", responsable.toUpperCase()];
            worksheet.mergeCells('A4:B4');
            row4.getCell(1).font = { bold: true };
            row4.getCell(3).alignment = { horizontal: 'center' };

            // Row 5: Metadata - Compañero
            const row5 = worksheet.getRow(5);
            row5.values = ["COMPAÑERO :", "", companero.toUpperCase()];
            worksheet.mergeCells('A5:B5');
            row5.getCell(1).font = { bold: true };
            row5.getCell(3).alignment = { horizontal: 'center' };

            worksheet.addRow([]); // Spacer

            // --- TABLE HEADER ---
            const tableHeader = ["🖐️ PRODUCTO", "HISTORIAL", "----CANTIDAD----"];
            const headerRow = worksheet.addRow(tableHeader);
            headerRow.height = 20;
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF388E3C' } }; // Professional Green
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            });

            // --- BODY ROWS ---
            products.forEach((p, index) => {
                const info = inventoryData[p] || { qty: 0, history: "0" };
                const row = worksheet.addRow([p, info.history || "0", info.qty]);
                
                // Centering Historial and Cantidad
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
                
                // Zebra Stripes
                if (index % 2 === 1) {
                    row.eachCell((cell) => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; // Very light green
                    });
                }

                // Borders for all cells
                row.eachCell((cell) => {
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                });
            });

            // Column Widths
            worksheet.getColumn(1).width = 45;
            worksheet.getColumn(2).width = 40;
            worksheet.getColumn(3).width = 20;

            // Generate Buffer and Save
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, \`Inventario_Pasillo${i}_\${formattedDate}.xlsx\`);
        };
    }
`;

    // Replace the old downloadBtn logic
    // We target the entire block from const downloadBtn to the end of its assignment
    const oldExportRegex = /const downloadBtn = document\.getElementById\('downloadBtn'\);[\s\S]*?writeFile\(wb, `Inventario_Pasillo\d+_\$\{formattedDate\}\.xlsx`\);\s*};\s*\}/;

    // Fallback if formatting is slightly different (due to previous edits)
    jsContent = jsContent.replace(oldExportRegex, newExportCode);

    fs.writeFileSync(jsPath, jsContent);
}

console.log('Done!');
