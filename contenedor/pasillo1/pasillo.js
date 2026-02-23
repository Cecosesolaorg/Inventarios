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

    // --- CONFIGURACIÓN DE FIREBASE PARA SINCRONIZAR PERSONAL ---
    try {
        const firebaseConfig = {
            databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/"
        };
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const database = firebase.database();

        // Función para sincronizar personal asignado
        const syncStaff = () => {
            const aisleTitle = document.querySelector('.aisle-title')?.innerText.toUpperCase() || "";
            database.ref('publishedStaff').on('value', (snapshot) => {
                const publishedStaff = snapshot.val() || {};
                const clean = s => s.replace(/[^A-Z0-9]/g, "");
                const cleanAisle = clean(aisleTitle);

                for (const area in publishedStaff) {
                    if (cleanAisle.includes(clean(area)) || clean(area).includes(cleanAisle)) {
                        const names = publishedStaff[area].split(" / ");
                        const resp1 = document.getElementById('team1-resp1');
                        const resp2 = document.getElementById('team1-resp2');
                        if (resp1) resp1.innerText = names[0] || "---";
                        if (resp2) resp2.innerText = names[1] || "---";
                        break;
                    }
                }
            });
        };
        syncStaff();
    } catch (e) {
        console.error("Error Firebase:", e);
    }

    // Lista inicial por defecto (si no hay nada guardado)
    const initialProducts = [
        "ACEITE DE OLIVA 250ML ", "ACEITE DE OLIVA 500ML", "ALIÑOS SAN MIGUEL GRANDE ", "ALIÑOS SAN MIGUEL PEQUEÑO ",
        "ALUMINIO ROLLO", "FIDEOS CAPRI", "PANELA DULCE", "PASTA CAPRI CORTA",
        "PASTA ESPECIAL LARGA", "PASTA CAPRI LARGA ", "PASTA INTEGRAL", "PASTA PRIMOR NEGRA LARGA Y CORTA",
        "PASTA PRIMOR ROJA EXTRA ESPECIAL LARGA", "PASTA PRIMOR ROJA EXTRA ESPECIAL CORTA", "PASTA RONCO", "PEPITO CHEEZ PECK", "PEPITO OSTIS",
        "TALLARINES ESPECIAL",
    ];

    // Cargar lista de productos (personalizada + base)
    let products = JSON.parse(localStorage.getItem('productsList')) || initialProducts;

    let searchTerm = "";

    // Cargar datos guardados
    let inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || {};

    const renderTable = () => {
        inventoryBody.innerHTML = '';

        // Actualizar contador de productos arriba (Solo los que están en VERDE)
        const totalCounted = Object.values(inventoryData).filter(p => p.checkState === 1).length;
        const countedTotalEl = document.getElementById('counted-total');
        if (countedTotalEl) countedTotalEl.textContent = totalCounted;

        const filteredProducts = products.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

        filteredProducts.forEach(p => {
            const data = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
            const row = document.createElement('tr');
            row.className = 'product-row';

            // Calcular diferencia
            let diffValue = "";
            let diffClass = "";

            // Persistir la diferencia si redQty existe y el checklist está activo (verde o rojo)
            if (data.redQty !== null && data.redQty !== undefined && (data.checkState === 1 || data.checkState === 2)) {
                const diff = (data.qty || 0) - (data.redQty || 0);
                diffValue = diff > 0 ? `+${diff}` : `${diff}`;
                diffClass = diff > 0 ? "diff-positive" : "diff-negative";
                if (diff === 0) diffValue = "0";
            }

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
                </td>
                <td class="col-diff ${diffClass}">${diffValue}</td>
            `;

            // Lógica de Checklist Mejorada:
            // 0 -> 2 (Rojo, Referencia)
            // 2 <-> 1 (Toggling entre Rojo/Verde)
            const checkArea = row.querySelector('.indicator');
            checkArea.onclick = (e) => {
                e.stopPropagation();
                const currentData = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };

                let newState;
                let redQty = currentData.redQty;

                if (currentData.checkState === 0 || !currentData.checkState) {
                    newState = 2; // Ir a ROJO y capturar base
                    redQty = currentData.qty || 0;
                } else if (currentData.checkState === 2) {
                    newState = 1; // Ir a VERDE (Mantiene base)
                } else {
                    newState = 2; // Ir a ROJO (Toggle)
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
                                localStorage.setItem('productsList', JSON.stringify(products));
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
                                localStorage.setItem('productsList', JSON.stringify(products));
                                renderTable();
                            }
                        }
                    }
                };
            }

            const qtyArea = row.querySelector('.col-qty');
            qtyArea.onclick = () => openCalculator(p);

            inventoryBody.appendChild(row);
        });
    };

    // BOTÓN AGREGAR PRODUCTO (Nueva Función)
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.onclick = () => {
            const newName = prompt("📝 Ingrese el nombre del nuevo producto:");
            if (newName && newName.trim()) {
                const finalName = newName.trim().toUpperCase();
                if (products.includes(finalName)) {
                    alert("⚠️ Este producto ya está en la lista.");
                    return;
                }
                products.push(finalName);
                localStorage.setItem('productsList', JSON.stringify(products));
                renderTable();
            }
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

    const savedInfoArea = document.querySelector('.saved-info');
    if (savedInfoArea) {
        savedInfoArea.style.cursor = "pointer";
        savedInfoArea.onclick = () => {
            if (currentExpression === "0") currentExpression = "ANS";
            else currentExpression += "ANS";
            updateImageStyleDisplay();
        };
    }

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
            const row1 = worksheet.getRow(1);
            row1.values = ["INVENTARIO DE VIVERES 🗃️ CECOSESOLA R.L J085030140 🗃️"];
            worksheet.mergeCells('A1:D1');
            row1.height = 30;
            row1.getCell(1).font = { name: 'Outfit', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            row1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
            row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

            const row2 = worksheet.getRow(2);
            row2.values = ["PASILLO Nº 1 🛒 DE FERIA DEL ESTE 🛒"];
            worksheet.mergeCells('A2:D2');
            row2.height = 25;
            row2.getCell(1).font = { name: 'Outfit', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
            row2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
            row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

            const row3 = worksheet.getRow(3);
            const now = new Date();
            const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            row3.values = ["FECHA", "", formattedDate];
            worksheet.mergeCells('A3:B3');
            row3.getCell(1).font = { bold: true };
            row3.getCell(3).alignment = { horizontal: 'center' };

            const row4 = worksheet.getRow(4);
            const responsable = localStorage.getItem('userName') || "SIN NOMBRE";
            row4.values = ["RESPONSABLE DIRECTO", "", responsable.toUpperCase()];
            worksheet.mergeCells('A4:B4');
            row4.getCell(1).font = { bold: true };
            row4.getCell(3).alignment = { horizontal: 'center' };

            const row5 = worksheet.getRow(5);
            const companero = localStorage.getItem('userLastName') || "";
            row5.values = ["COMPAÑERO :", "", companero.toUpperCase()];
            worksheet.mergeCells('A5:B5');
            row5.getCell(1).font = { bold: true };
            row5.getCell(3).alignment = { horizontal: 'center' };

            const assistantName = localStorage.getItem('assistantName') || "SIN ASIGNAR";
            const row6 = worksheet.getRow(6);
            row6.values = ["AYUDANTE :", "", assistantName.toUpperCase()];
            worksheet.mergeCells('A6:B6');
            row6.getCell(1).font = { bold: true };
            row6.getCell(3).alignment = { horizontal: 'center' };

            // --- TOTAL PRODUCTS COUNTED (Solo los que están en VERDE) ---
            const totalInventoried = Object.values(inventoryData).filter(p => p.checkState === 1).length;
            const row7 = worksheet.getRow(7);
            row7.values = ["TOTAL PRODUCTOS CONTADOS", "", totalInventoried];
            worksheet.mergeCells('A7:B7');
            row7.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };
            row7.getCell(3).font = { bold: true, color: { argb: 'FFFF0000' } };
            row7.getCell(3).alignment = { horizontal: 'center' };

            worksheet.addRow([]); // Spacer

            // --- TABLE HEADER ---
            const tableHeader = ["🖐️ PRODUCTO", "HISTORIAL", "----CANTIDAD----", "dif"];
            const headerRow = worksheet.addRow(tableHeader);
            headerRow.height = 20;
            headerRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true, color: { argb: colNumber === 4 ? 'FFFF0000' : 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 4 ? 'FFFFFFFF' : 'FF388E3C' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: colNumber === 4 ? { argb: 'FFFF0000' } : { argb: 'FF000000' } },
                    left: { style: 'thin', color: colNumber === 4 ? { argb: 'FFFF0000' } : { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: colNumber === 4 ? { argb: 'FFFF0000' } : { argb: 'FF000000' } },
                    right: { style: 'thin', color: colNumber === 4 ? { argb: 'FFFF0000' } : { argb: 'FF000000' } }
                };
            });

            // --- BODY ROWS ---
            const fullListToggle = document.getElementById('fullListToggle');
            const isFullList = fullListToggle ? fullListToggle.checked : false;

            // Usar la lista maestra 'products' para filtrar lo que se exporta
            const exportList = products.filter(p => {
                if (isFullList) return true;
                return inventoryData[p] && inventoryData[p].qty > 0;
            });

            exportList.forEach((p, index) => {
                const info = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };

                let diffVal = "";
                if (info.redQty !== null && info.redQty !== undefined && (info.checkState === 1 || info.checkState === 2)) {
                    diffVal = info.qty - info.redQty;
                }

                const row = worksheet.addRow([p, info.history || "0", info.qty, diffVal]);

                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
                row.getCell(4).alignment = { horizontal: 'center' };

                // Zebra Stripes
                if (index % 2 === 1) {
                    row.eachCell((cell, colNumber) => {
                        if (colNumber < 4) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
                        }
                    });
                }

                // Borders
                row.eachCell((cell, colNumber) => {
                    if (colNumber === 4) {
                        cell.font = { color: { argb: 'FFFF0000' } };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFFF0000' } },
                            left: { style: 'thin', color: { argb: 'FFFF0000' } },
                            bottom: { style: 'thin', color: { argb: 'FFFF0000' } },
                            right: { style: 'thin', color: { argb: 'FFFF0000' } }
                        };
                    } else {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    }
                });
            });

            worksheet.getColumn(1).width = 45;
            worksheet.getColumn(2).width = 40;
            worksheet.getColumn(3).width = 20;
            worksheet.getColumn(4).width = 10;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const cleanAisle = document.querySelector('.aisle-title').textContent.toLowerCase();
            const fileName = `${responsable.toLowerCase()}.${cleanAisle}.xlsx`;
            saveAs(blob, fileName);
        };
    }

    const helperBtn = document.getElementById('helperBtn');
    if (helperBtn) {
        helperBtn.onclick = () => {
            const mode = prompt("PANEL DE COORDINACIÓN:\n1. ASIGNAR AYUDA (Coordinador/Sistema)\n2. Ver Guía del Systema\n(Escriba 1 o 2)");
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
                alert("SISTEMA DE INVENTARIO V1.5\n\n- Toca la cantidad para abrir la calculadora.\n- Usa ANS para operar sobre el total guardado.\n- El historial se guarda automáticamente para el Excel.\n- Registro Rápido (⚡) permite editar sin calculadora.\n- Checklist: Blanco -> Rojo (Referencia Difference) -> Verde (Confirmado). Toggle entre Rojo/Verde.");
            }
        };
    }

    const savedTitle = localStorage.getItem('aisleTitle');
    if (savedTitle) {
        const titleEl = document.querySelector('.aisle-title');
        if (titleEl) titleEl.textContent = savedTitle.toUpperCase();
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            const pass = prompt("INTRODUZCA CONTRASEÑA PARA BORRAR TODO:");
            if (pass === "085030140") {
                if (confirm("¿ESTÁ REALMENTE SEGURO? Esta acción no se puede deshacer.")) {
                    inventoryData = {};
                    localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                    renderTable();
                    alert("Datos borrados correctamente.");
                }
            } else if (pass !== null) {
                alert("CONTRASEÑA INCORRECTA");
            }
        };
    }

    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchTerm = e.target.value;
            renderTable();
        };
    }

    renderTable();
});
