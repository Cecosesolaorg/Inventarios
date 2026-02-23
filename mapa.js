// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const displayName = document.getElementById('display-name');
    const name = localStorage.getItem('userName');
    const lastName = localStorage.getItem('userLastName');
    if (name && displayName) {
        displayName.textContent = `${name} ${lastName || ''}`;
    }

    // --- MEMORIA SIEMPRE VIVA ---
    let currentData = JSON.parse(localStorage.getItem('cachedPublishedStaff')) || {};

    function updateMapUI(publishedStaff) {
        if (!publishedStaff) return;
        currentData = publishedStaff;
        localStorage.setItem('cachedPublishedStaff', JSON.stringify(publishedStaff));

        console.log("📍 Actualizando UI con:", publishedStaff);

        const cards = document.querySelectorAll('.map-card');
        cards.forEach((card) => {
            // Limpiar bloques de nombres
            const oldList = card.querySelectorAll('.staff-names-list');
            oldList.forEach(o => o.remove());

            const cardTextEl = card.querySelector('.card-text');
            if (cardTextEl) {
                const cardTitle = cardTextEl.textContent.trim().toUpperCase();

                for (const areaTitle in publishedStaff) {
                    const cleanArea = areaTitle.trim().toUpperCase();

                    if (cardTitle.includes(cleanArea) || cleanArea.includes(cardTitle)) {
                        const rawNames = publishedStaff[areaTitle];
                        if (rawNames && rawNames.trim() !== "") {
                            const namesContainer = document.createElement('div');
                            namesContainer.className = 'staff-names-list';
                            Object.assign(namesContainer.style, {
                                width: '100%',
                                marginTop: '15px',
                                textAlign: 'left',
                                paddingLeft: '10px'
                            });

                            const individualNames = rawNames.split(" / ");
                            individualNames.forEach(n => {
                                const nameEl = document.createElement('div');
                                nameEl.innerText = n.toLowerCase();
                                Object.assign(nameEl.style, {
                                    color: '#ff0000',
                                    fontSize: '1.2rem',
                                    fontWeight: '700',
                                    margin: '0',
                                    lineHeight: '1.2'
                                });
                                namesContainer.appendChild(nameEl);
                            });
                            card.appendChild(namesContainer);
                        }
                        break;
                    }
                }
            }
        });
    }

    // Escuchar Firebase (Lo más importante)
    database.ref('publishedStaff').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        updateMapUI(data);

        const toast = document.getElementById('sync-toast');
        if (toast) {
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 1500);
        }
    });

    // --- FUNCIÓN DEL BOTÓN ---
    const whereBtn = document.getElementById('where-am-i-btn');
    const assignmentModal = document.getElementById('assignmentModal');
    const assignmentList = document.getElementById('assignment-list');

    function fillList() {
        assignmentList.innerHTML = '';
        const areas = Object.keys(currentData);

        if (areas.length === 0) {
            assignmentList.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <p style="color:#ff0000; font-weight:bold; font-size:1.2rem;">¡LOS DATOS NO LLEGAN! 🛑</p>
                    <p style="color:#888; font-size:0.9rem; margin: 15px 0;">El internet podría estar fallando o no has publicado nada nuevo.</p>
                    <button id="retry-btn" style="background:#40c9ff; border:none; padding:10px 20px; border-radius:10px; font-weight:bold; cursor:pointer;">🔄 REINTENTAR CARGA</button>
                </div>`;

            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    location.reload(); // Recarga la página para forzar conexión
                };
            }
        } else {
            areas.sort().forEach(aisle => {
                const row = document.createElement('div');
                row.className = 'staff-item-row';
                row.innerHTML = `
                    <span class="staff-item-area">${aisle}</span>
                    <span class="staff-item-names">${currentData[aisle].toLowerCase()}</span>
                `;
                assignmentList.appendChild(row);
            });
        }
    }

    if (whereBtn) {
        whereBtn.onclick = () => {
            fillList();
            if (assignmentModal) assignmentModal.style.display = 'flex';
        };
    }

    // Carga inicial rápida
    updateMapUI(currentData);
});
