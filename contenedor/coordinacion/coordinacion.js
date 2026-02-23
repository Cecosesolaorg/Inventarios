// CONFIGURACIÓN DE FIREBASE (Base de datos en tiempo real)
const firebaseConfig = {
    databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase de inmediato al cargar el script
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // Pedir clave de acceso a coordinación (Bypass si es el Admin)
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        const accessPass = prompt("ACCESO RESTRINGIDO - COORDINACIÓN\nIntroduzca la clave:");
        if (accessPass !== "124578963") {
            alert("CLAVE INCORRECTA - VOLVIENDO AL MAPA");
            window.location.href = "../../mapa.html";
            return;
        }
    }

    const mainTitle = document.getElementById('mainTitle');
    const coordGrid = document.getElementById('coordGrid');

    // Quitar el "CARGANDO" de inmediato una vez aceptada la clave
    mainTitle.textContent = `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`;

    // Referencias a botones
    const addAreaBtn = document.getElementById('addAreaBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');
    const publishBtn = document.getElementById('publishBtn');

    // Áreas por defecto sincronizadas con el Mapa
    const defaultAreas = [
        { title: "PASILLO 1 PASTAS", names: ["", ""] },
        { title: "PASILLO 2 CAFE", names: ["", "", "", ""] },
        { title: "PASILLO 3 PANES", names: ["", ""] },
        { title: "PASILLO 4 GALLETAS", names: ["", "", "", ""] },
        { title: "PASILLO 5 SALSA", names: ["", "", "", ""] },
        { title: "PASILLO 6 JABON", names: ["", "", "", ""] },
        { title: "PASILLO 7 PAPEL", names: ["", ""] },
        { title: "PASILLO 8", names: ["", ""] },
        { title: "PASILLO GRANOS", names: ["", "", ""] },
        { title: "CAVA CUARTO", names: ["", "", "", ""] },
        { title: "PASILLO ARRIBA 1-3", names: ["", ""] },
        { title: "PASILLO ARRIBA 4-6", names: ["", ""] },
        { title: "REGUERA", names: ["", ""] },
        { title: "FRUTERIA", names: ["", ""] },
        { title: "MASCOTA", names: ["", ""] },
        { title: "DEPÓSITO ABAJO", names: ["", "", "", ""] },
        { title: "DEPÓSITO ARRIBA", names: ["", ""] }
    ];

    let currentCoordData = {
        title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
        areas: defaultAreas
    };

    // FUNCIÓN PARA CARGAR DESDE FIREBASE O RESPALDO
    const loadFromFirebase = () => {
        // Cargar respaldo local primero para rapidez
        const backup = localStorage.getItem('coordDataBackup');
        if (backup) {
            currentCoordData = JSON.parse(backup);
            renderGrid();
        }

        if (!firebase.apps.length || !database) return;

        database.ref('coordinacion').once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data && data.areas) {
                currentCoordData = data;
                mainTitle.textContent = currentCoordData.title;
                renderGrid();
            }
        }).catch(err => {
            console.error("Error Firebase:", err);
        });
    };

    const renderGrid = () => {
        coordGrid.innerHTML = '';
        currentCoordData.areas.forEach((area, index) => {
            const card = document.createElement('article');
            card.className = 'area-card';

            let namesHTML = '';
            area.names.forEach((name, nIndex) => {
                namesHTML += `<input type="text" class="name-input" value="${name || ''}" data-area="${index}" data-name="${nIndex}" placeholder="NOMBRE...">`;
            });

            card.innerHTML = `
                <div class="area-header">
                    <span class="area-title" contenteditable="true" data-index="${index}">${area.title}</span>
                </div>
                <div class="names-list">
                    ${namesHTML}
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <button class="btn-add-name" onclick="addName(${index})" style="background:none; border:none; color:#3ca1e3; cursor:pointer; font-size:0.75rem;">+ persona</button>
                        <button class="btn-remove-area" onclick="removeArea(${index})" style="background:none; border:none; color:#eb5757; cursor:pointer; font-size:0.75rem;">eliminar</button>
                    </div>
                </div>
            `;
            coordGrid.appendChild(card);
        });

        // Actualizar datos locales al cambiar nombres
        document.querySelectorAll('.name-input').forEach(input => {
            input.oninput = (e) => {
                const aIdx = e.target.dataset.area;
                const nIdx = e.target.dataset.name;
                currentCoordData.areas[aIdx].names[nIdx] = e.target.value.toUpperCase();
                // GUARDAR RESPALDO LOCAL INMEDIATO
                localStorage.setItem('coordDataBackup', JSON.stringify(currentCoordData));
            };
        });

        // Actualizar títulos locales
        document.querySelectorAll('.area-title').forEach(title => {
            title.onblur = (e) => {
                const idx = e.target.dataset.index;
                currentCoordData.areas[idx].title = e.target.textContent.toUpperCase();
            };
        });
    };

    // Funciones globales para botones dinámicos
    window.addName = (areaIndex) => {
        if (!currentCoordData.areas[areaIndex].names) currentCoordData.areas[areaIndex].names = [];
        currentCoordData.areas[areaIndex].names.push("");
        renderGrid();
    };

    window.removeArea = (areaIndex) => {
        if (confirm("¿Eliminar esta área de coordinación?")) {
            currentCoordData.areas.splice(areaIndex, 1);
            renderGrid();
        }
    };

    addAreaBtn.onclick = () => {
        const title = prompt("NOMBRE DE LA NUEVA ÁREA:");
        if (title) {
            currentCoordData.areas.push({ title: title.toUpperCase(), names: [""] });
            renderGrid();
        }
    };

    saveBtn.onclick = () => {
        currentCoordData.title = mainTitle.textContent;
        // GUARDAR EN FIREBASE
        database.ref('coordinacion').set(currentCoordData).then(() => {
            alert("¡Datos de coordinación guardados en la nube!");
        }).catch(err => {
            console.error(err);
            alert("Error al guardar en la nube.");
        });
    };

    publishBtn.onclick = () => {
        // Bloquear botón para evitar doble clic
        publishBtn.disabled = true;
        publishBtn.innerHTML = "<span>⌛</span> PUBLICANDO...";

        const currentUser = (localStorage.getItem('userName') || "").toUpperCase();
        const currentLastName = (localStorage.getItem('userLastName') || "").toUpperCase();
        const fullUserName = `${currentUser} ${currentLastName}`.trim();

        // VALIDACIÓN DE SEGURIDAD PARA JAVIER CAMERO
        if (fullUserName !== "JAVIER CAMERO" && localStorage.getItem('isAdmin') !== 'true') {
            const pass = prompt("SOLO JAVIER CAMERO O ADMIN PUEDEN PUBLICAR.\nIntroduzca clave de autorización:");
            if (pass !== "124578963") {
                alert("AUTORIZACIÓN DENEGADA");
                publishBtn.disabled = false;
                publishBtn.innerHTML = "<span>📢</span> PUBLICAR";
                return;
            }
        }

        currentCoordData.title = mainTitle.textContent;

        // Crear mapa para el personal publicado
        const staffMap = {};
        currentCoordData.areas.forEach(area => {
            const names = area.names.filter(n => n && n.trim() !== "");
            if (names.length > 0) {
                const cleanTitle = area.title.trim().toUpperCase();
                staffMap[cleanTitle] = names.join(" / ");
            }
        });

        console.log("📤 Intentando publicar en Firebase:", staffMap);

        // --- SALIDA DE EMERGENCIA ---
        const safetyTimeout = setTimeout(() => {
            console.warn("⚠️ Tiempo de espera agotado, forzando redirección...");
            window.location.href = "../../mapa.html";
        }, 3000);

        // Intento de envío real
        database.ref().update({
            'publishedStaff': staffMap,
            'lastSync': Date.now()
        }).then(() => {
            clearTimeout(safetyTimeout);
            console.log("✅ Datos sincronizados correctamente.");
            window.location.href = "../../mapa.html";
        }).catch(err => {
            clearTimeout(safetyTimeout);
            console.error("❌ Error Firebase:", err);
            alert("ERROR DE RED: " + err.message);
            publishBtn.disabled = false;
            publishBtn.innerHTML = "<span>📢</span> PUBLICAR";
        });
    };

    clearBtn.onclick = () => {
        const pass = prompt("CONTRASEÑA PARA BORRAR TODO:");
        if (pass === "085030140") {
            currentCoordData = {
                title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
                areas: [...defaultAreas]
            };
            mainTitle.textContent = currentCoordData.title;
            database.ref('coordinacion').set(currentCoordData);
            localStorage.removeItem('coordDataBackup');
            renderGrid();
        } else if (pass !== null) {
            alert("CONTRASEÑA INCORRECTA");
        }
    };

    exportBtn.onclick = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Coordinación');
        const colWidths = [25, 25, 25, 25, 25];
        worksheet.columns = colWidths.map(w => ({ width: w }));

        const mainHeaderRow = worksheet.addRow([mainTitle.textContent]);
        worksheet.mergeCells(`A1:E1`);
        const mainCell = worksheet.getCell('A1');
        mainCell.font = { size: 18, bold: true, color: { argb: 'FFF39C12' } };
        mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1D' } };
        mainCell.alignment = { horizontal: 'center' };

        let currentRow = 3;
        let currentCol = 1;
        currentCoordData.areas.forEach((area) => {
            const headerCell = worksheet.getCell(currentRow, currentCol);
            headerCell.value = area.title;
            headerCell.font = { bold: true, color: { argb: 'FF3CA1E3' } };
            headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C2C2E' } };

            area.names.forEach((name, i) => {
                const cell = worksheet.getCell(currentRow + i + 1, currentCol);
                cell.value = name || "---";
                cell.border = { bottom: { style: 'thin' } };
            });

            currentCol++;
            if (currentCol > 5) {
                currentCol = 1;
                currentRow += 6;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Coordinacion_Inventario.xlsx`);
    };

    // Carga inicial
    loadFromFirebase();
});
