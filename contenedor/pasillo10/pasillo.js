document.addEventListener('DOMContentLoaded', () => {
    // Current date
    const dateTag = document.getElementById('current-date');
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    dateTag.textContent = `FECHA: ${formattedDate}`;

    // Sincronizar nombres del encabezado desde localStorage
    const responsable = localStorage.getItem('responsableDirecto') || "SIN ASIGNAR";
    const companero = localStorage.getItem('companero') || "SIN ASIGNAR";

    document.getElementById('team1-resp1').textContent = responsable.toUpperCase();
    document.getElementById('team1-resp2').textContent = companero.toUpperCase();

    const inventoryBody = document.getElementById('inventory-body');
    let products = [
        "ACEITE DE OLIVA 250ML",
        "ACEITE DE OLIVA 500ML",
        "ALIÃ‘OS SAN MIGUEL GRANDE",
        "ALIÃ‘OS SAN MIGUEL PEQUEÃ‘O",
        "ALUMINIO ROLLO",
        "FIDEOS CAPRI",
        "PANELA DULCE",
        "PASTA CAPRI CORTA",
        "PASTA ESPECIAL LARGA",
        "PASTA CAPRI LARGA",
        "PASTA INTEGRAL",
        "PASTA PRIMOR NEGRA LARGA Y CORTA"
    ];

    let searchTerm = "";
    let fastEditActive = false;

    // Cargar datos guardados
    let inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || {};

    const renderTable = () => {
        inventoryBody.innerHTML = '';
        const filteredProducts = products.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

        filteredProducts.forEach(p => {
            const data = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
            const row = document.createElement('tr');
            row.className = 'product-row';

            // Calcular diferencia para mostrar en UI si está en VERDE o ROJO
            let diffHTML = "";
            if ((data.checkState === 1 || data.checkState === 2) && data.redQty !== null && data.redQty !== undefined && data.qty > data.redQty) {
                diffHTML = `<span class="diff-tag">+${data.qty - data.redQty}</span>`;
            }

            if (fastEditActive) {
                row.innerHTML = `
                    <td class="col-check">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="indicator state-${data.checkState || 0}"></div> 
                            <span class="product-name">${p}</span>
                        </div>
                    </td>
                    <td class="col-qty">
                        <input type="number" class="fast-qty-input" value="${data.qty}" data-product="${p}">
                    </td>
                `;
            } else {
                // Show history in the table row
                const historyText = (data.history && data.history !== "0")
                    ? `<div style="font-size: 0.75rem; color: #3ca1e3; margin-top: 4px;">Historial: ${data.history}</div>`
                    : "";

                row.innerHTML = `
                    <td class="col-check">
                        <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <div class="indicator state-${data.checkState || 0}"></div> 
                            <div style="display: flex; flex-direction: column;">
                                <span class="product-name">${p}</span>
                                ${historyText}
                            </div>
                            <span class="edit-product-btn" title="Acciones" style="font-size: 0.8rem; opacity: 0.8; margin-left: 8px; cursor: pointer;">✏️</span>
                        </div>
                    </td>
                    <td class="col-qty" style="cursor: pointer;">
                        <span class="qty-val" id="qty-${p.replace(/\s/g, '_')}">${data.qty ?? 0}</span>
                        ${diffHTML}
                    </td>
                `;
            }

            // Click en el indicador/nombre cicla entre 4 estados
            const checkArea = row.querySelector('.indicator');
            checkArea.onclick = (e) => {
                e.stopPropagation();
                const currentData = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
                let newState = ((currentData.checkState || 0) + 1) % 4;

                let redQty = currentData.redQty;
                if (newState === 2) {
                    redQty = currentData.qty || 0;
                }

                inventoryData[p] = { ...currentData, checkState: newState, redQty: redQty };
                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                renderTable();
            };

            // Acciones de edición
            const editBtn = row.querySelector('.edit-product-btn');
            if (editBtn) {
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    const choice = prompt(`Acciones para "${p}":\n1. Renombrar\n2. Eliminar Producto\n(Escriba 1 o 2)`);
                    if (choice === "1") {
                        const newName = prompt("Editar nombre del producto:", p);
                        if (newName && newName.trim() && newName.trim().toUpperCase() !== p) {
                            const finalName = newName.trim().toUpperCase();
                            if (products.includes(finalName)) {
                                alert("Ya existe un producto con ese nombre.");
                                return;
                            }
                            const index = products.indexOf(p);
                            if (index !== -1) {
                                products[index] = finalName;
                                inventoryData[finalName] = inventoryData[p];
                                delete inventoryData[p];
                                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                                renderTable();
                            }
                        }
                    } else if (choice === "2") {
                        if (confirm(`¿Está seguro de que desea eliminar "${p}"?`)) {
                            const index = products.indexOf(p);
                            if (index !== -1) {
                                products.splice(index, 1);
                                delete inventoryData[p];
                                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                                renderTable();
                            }
                        }
                    }
                };
            }

            // Lógica de registro rápido vs click normal
            if (fastEditActive) {
                const input = row.querySelector('.fast-qty-input');
                input.onchange = (e) => {
                    const newQty = parseFloat(e.target.value) || 0;
                    inventoryData[p] = { ...inventoryData[p], qty: newQty };
                    localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                };
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        const nextRow = row.nextElementSibling;
                        if (nextRow) {
                            const nextInput = nextRow.querySelector('.fast-qty-input');
                            if (nextInput) nextInput.focus();
                        }
                    }
                };
            } else {
                const qtyArea = row.querySelector('.col-qty');
                qtyArea.onclick = () => openCalculator(p);
            }

            inventoryBody.appendChild(row);
        });
    };

    // Fast Edit Toggle
    const fastEditBtn = document.getElementById('fastEditBtn');
    if (fastEditBtn) {
        fastEditBtn.onclick = () => {
            fastEditActive = !fastEditActive;
            fastEditBtn.style.backgroundColor = fastEditActive ? "#7fbb00" : "";
            fastEditBtn.style.color = fastEditActive ? "#000" : "";
            renderTable();
        };
    }

    const modal = document.getElementById('calcModal');
    const calcResult = document.getElementById('calcResult');
    const currentSavedDisplay = document.getElementById('current-saved-val');

    let tempTotal = 0;
    let tempHistory = "0";
    let currentExpression = "0";
    let activeProduct = "";

    window.openCalculator = (product) => {
        activeProduct = product;
        document.getElementById('calc-product-name').textContent = product;
        const data = inventoryData[product] || { qty: 0, history: "0" };

        tempTotal = data.qty || 0;
        tempHistory = data.history || "0";
        currentExpression = "0";

        updateImageStyleDisplay();
        modal.style.display = 'flex';
    };

    const updateImageStyleDisplay = () => {
        currentSavedDisplay.textContent = tempTotal;
        calcResult.textContent = currentExpression;
    };

    const handleCalcInput = (btn) => {
        const val = btn.textContent;
        const op = btn.dataset.op;

        if (op === 'C') {
            currentExpression = "0";
        } else if (op === 'ANS') {
            if (currentExpression === "0") currentExpression = "ANS";
            else currentExpression += "ANS";
        } else {
            if (currentExpression === "0" && !isNaN(val)) currentExpression = val;
            else currentExpression += val;
        }
        updateImageStyleDisplay();
    };

    document.querySelectorAll('.num-btn').forEach(btn => {
        if (!btn.classList.contains('clear-btn')) {
            btn.onclick = () => handleCalcInput(btn);
        }
    });

    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.onclick = () => handleCalcInput(btn);
    });

    document.querySelector('.clear-btn').onclick = () => {
        currentExpression = "0";
        updateImageStyleDisplay();
    };

    // Make the "Actualmente guardado" text also act as ANS
    const savedInfoArea = document.querySelector('.saved-info');
    if (savedInfoArea) {
        savedInfoArea.style.cursor = "pointer";
        savedInfoArea.onclick = () => {
            if (currentExpression === "0") currentExpression = "ANS";
            else currentExpression += "ANS";
            updateImageStyleDisplay();
        };
    }

    // "SUMAR CANTIDAD" button logic - FULL ACCUMULATIVE HISTORY
    document.getElementById('btnSumarCant').onclick = () => {
        try {
            let evalExpr = currentExpression.replace(/ANS/g, tempTotal).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            let result = eval(evalExpr);

            if (!isNaN(result)) {
                let prevTotal = tempTotal;
                let isOperationOnTotal = currentExpression.includes("ANS");
                let newTotal;
                let historyStep = "";

                if (isOperationOnTotal) {
                    newTotal = result;
                    historyStep = ` (${currentExpression.replace(/ANS/g, prevTotal)}) = ${newTotal}`;
                } else {
                    newTotal = prevTotal + result;
                    historyStep = ` + ${currentExpression} = ${newTotal}`;
                }

                if (tempHistory === "0" || tempHistory === "") {
                    if (isOperationOnTotal) {
                        tempHistory = `${currentExpression.replace(/ANS/g, prevTotal)} = ${newTotal}`;
                    } else {
                        tempHistory = `${currentExpression} = ${newTotal}`;
                    }
                } else {
                    tempHistory += historyStep;
                }

                tempTotal = newTotal;
                currentExpression = "0";
            }
        } catch (e) {
            alert("Operación inválida");
        }
        updateImageStyleDisplay();
    };

    window.closeCalculator = () => {
        modal.style.display = 'none';
    };

    window.saveCalculation = () => {
        inventoryData[activeProduct] = {
            ...inventoryData[activeProduct],
            qty: tempTotal,
            history: tempHistory
        };
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
        renderTable();
        closeCalculator();
    };

    // Excel Export matching USER image
    
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
            row2.values = ["PASILLO Nº 10 🛒 DE FERIA DEL ESTE 🛒"];
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
            row4.values = ["RESPONSABLE DIRECTO", "", responsable.toUpperCase()];
            worksheet.mergeCells('A4:B4');
            row4.getCell(1).font = { bold: true };
            row4.getCell(3).alignment = { horizontal: 'center' };

            // Row 5: Metadata - Compañero
            const row5 = worksheet.getRow(5);
            row5.values = ["COMPAÑERO :", "", companero.toUpperCase()];
            worksheet.mergeCells('A5:B5');
            row5.getCell(1).font = { bold: true };
            row5.getCell(3).alignment = { horizontal: 'center' };

            
            // Row 6: Metadata - Ayudante
            const assistantName = localStorage.getItem('assistantName') || "SIN ASIGNAR";
            const row6 = worksheet.getRow(6);
            row6.values = ["AYUDANTE :", "", assistantName.toUpperCase()];
            worksheet.mergeCells('A6:B6');
            row6.getCell(1).font = { bold: true };
            row6.getCell(3).alignment = { horizontal: 'center' };

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
            
            const cleanAisle = document.querySelector('.aisle-title').textContent.toLowerCase();
            const fileName = `${responsable.toLowerCase()}.${cleanAisle}.xlsx`;
            saveAs(blob, fileName);
        };
    }


    // Botón Coordinador / Sistema (Helper)
    const helperBtn = document.getElementById('helperBtn');
    if (helperBtn) {
        
        
        helperBtn.onclick = () => {
            const mode = prompt("PANEL DE COORDINACIÓN:\n1. ASIGNAR AYUDA (Coordinador/Sistema)\n2. Ver Guía del Sistema\n(Escriba 1 o 2)");

            if (mode === "1") {
                const type = prompt("AYUDA:\n1. COORDINADOR\n2. SISTEMA\n(Escriba 1 o 2)");
                let label = "";
                if (type === "1") label = "COORDINADOR";
                else if (type === "2") label = "SISTEMA";

                if (label) {
                    const name = prompt(`Ingrese el nombre del ${label}:`);
                    if (name) {
                        localStorage.setItem('assistantName', `${label}: ${name.toUpperCase()}`);
                        alert(`Ayudante asignado: ${label}: ${name.toUpperCase()}`);
                    }
                }
            } else if (mode === "2") {
                alert("SISTEMA DE INVENTARIO V1.5\n\n- Toca la cantidad para abrir la calculadora.\n- Usa ANS para operar sobre el total guardado.\n- El historial se guarda automáticamente para el Excel.\n- Registro Rápido (⚡) permite editar sin calculadora.");
            }
        };
    }

    // Load saved aisle title if exists
    const savedTitle = localStorage.getItem('aisleTitle');
    if (savedTitle) {
        const titleEl = document.querySelector('.aisle-title');
        if (titleEl) titleEl.textContent = savedTitle.toUpperCase();
    }

    // Vaciar inventario
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm("¿Desea borrar TODOS los datos de este pasillo?")) {
                inventoryData = {};
                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                renderTable();
            }
        };
    }

    // Lógica de búsqueda en tiempo real
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchTerm = e.target.value;
            renderTable();
        };
    }

    renderTable();
});
