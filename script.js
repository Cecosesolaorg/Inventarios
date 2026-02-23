document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const responsable = document.getElementById('responsable').value.trim();
        const companero = document.getElementById('companero').value.trim();

        // 1. CASO ADMINISTRADOR (JAVIER CAMERO)
        if (responsable.toUpperCase() === "JAVIER CAMERO") {
            const adminPass = prompt("SISTEMA DE ADMINISTRADOR\nHola Javier, introduzca su clave:");

            // Verificamos la clave
            if (adminPass && adminPass.trim() === "Elie2023") {
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('userName', "JAVIER CAMERO");
                localStorage.setItem('userLastName', "");
                localStorage.setItem('responsableDirecto', "JAVIER CAMERO");
                localStorage.setItem('companero', companero || "ADMIN"); // Compañero opcional para el admin

                ejecutarEntrada();
                return;
            } else if (adminPass !== null) {
                alert('CLAVE DE ADMINISTRADOR INCORRECTA');
                return;
            } else {
                return; // Cancelado
            }
        }

        // 2. CASO USUARIO NORMAL
        if (responsable && companero) {
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('userName', responsable);
            localStorage.setItem('userLastName', "");
            localStorage.setItem('responsableDirecto', responsable);
            localStorage.setItem('companero', companero);

            ejecutarEntrada();
        } else {
            alert('Para usuarios generales, por favor completa ambos campos.');
        }
    });

    function ejecutarEntrada() {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Procesando...</span>';
        setTimeout(() => {
            window.location.href = 'mapa.html';
        }, 800);
    }

    // Efecto sutil de seguimiento de mouse para el brillo del fondo (opcional/premium)
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        document.querySelector('.background-glow').style.background = `
            radial-gradient(circle at ${x}% ${y}%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
            radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(0, 210, 255, 0.15) 0%, transparent 40%)
        `;
    });
});
