// ==========================================
// 1. VARIABLES GLOBALES DE ESTADO DEL JUEGO
// Definimos las variables globales que guardaran
// la informacion en la memoria de la aplicacion
// mientras el usuario juega.
// ==========================================
let jugador = "";
let preguntasTotales = [];
let preguntasFalladas = [];
let rondaActual = 1;
let aciertos = 0;
let fallos = 0;

// ===================================================
// 2. REFERENCIAS A ELEMENTOS DEL DOM
// Apuntamos a las etiquetas del html mediante los id
// ===================================================
const landingSection = document.getElementById("landing-section");
const gameSection = document.getElementById("game-section");
const btnIniciar = document.getElementById("btn-iniciar");
const inputNickname = document.getElementById("nickname");
const displayJugador = document.getElementById("display-jugador");
const displayRonda = document.getElementById("display-ronda");
const roundsContainer = document.getElementById("rounds-container");
const btnComprobar = document.getElementById("btn-comprobar");

// Modal de fin de juego
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalStats = document.getElementById("modal-stats");
const modalBtn = document.getElementById("modal-btn");

// ==========================================
// 3.LOCALSTORAGE AL CARGAR LA PÁGINA
// ==========================================
// Comprobamos si el navegador ya tiene un nickname guardado de una partida anterior
const nombreRecuperado = localStorage.getItem("quizmaster_nickname");
if(nombreRecuperado) {
    inputNickname.value = nombreRecuperado;
}

// ==========================================
// 4. FUNCIÓN PARA BARAJAR ARRAYS
// ==========================================
// Desordena cualquier array de forma aleatoria real para que nunca se repita la posición
function barajarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

// ==========================================
// 5. CARGA ASÍNCRONA DEL FICHERO JSON
// ==========================================
async function cargarPreguntas() {
    try{
        const respuesta = await fetch("questions.json");
        preguntasTotales = await respuesta.json();
        barajarArray(preguntasTotales);
    }catch (error) {
        console.error("Error al cargar questions.json:", error);
        alert("No se pudieron cargar las preguntas del servidor")
    }
}

// ==========================================
// 6. EVENTO: INICIAR JUEGO (LANDING)
// Gestionamos la transicion de la pantalla
// de bienvenida al tablero de juego
// ==========================================
btnIniciar.addEventListener("click", async () => {
    jugador = inputNickname.value.trim();

    if (jugador === "") {
        alert("Por favor, introduce un nombre o nickname para jugar.");
        return;
    }

    localStorage.setItem("quizmaster_nickname", jugador);

    landingSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    displayJugador.textContent = `Jugador: ${jugador}`;

    if (preguntasTotales.length === 0) {
        await cargarPreguntas();
    }

    renderizarRonda();
});

// ==========================================
// 7. RENDERIZADO DINÁMICO DE RONDAS
// ==========================================
function renderizarRonda() {
    const inicio = (rondaActual - 1) * 2;
    const preguntasRonda = preguntasTotales.slice(inicio, inicio + 2);

    displayRonda.textContent = `Ronda ${rondaActual} de 2`;

    const roundBox = document.createElement("div");
    roundBox.classList.add("round-box");
    roundBox.id = `round-${rondaActual}`;

    preguntasRonda.forEach((item, index) => {
        const numeroPregunta = inicio + index + 1;
        const opcionesMezcladas = barajarArray([...item.opciones]);

        const card = document.createElement("div");
        card.classList.add("question-card");
        card.dataset.respuestaCorrecta = item.respuesta;

        card.innerHTML = `
            <h3>Pregunta ${numeroPregunta}</h3>
            <h4>${item.pregunta}</h4>
            <div class="options-grid">
                ${opcionesMezcladas.map(opcion => `
                    <button class="option-btn" type="button" onclick="seleccionarOpcion(this)">${opcion}</button>
                `).join('')}
            </div>
        `;
        roundBox.appendChild(card);
    });

    roundsContainer.appendChild(roundBox);
}
// ==========================================
// 8. CONTROL DE SELECCIÓN DE RESPUESTA
// ==========================================
window.seleccionarOpcion = function(botonPulsado) {
    const contenedorOpciones = botonPulsado.parentElement;
    const todosLosBotones = contenedorOpciones.querySelectorAll(".option-btn");

    todosLosBotones.forEach(btn => btn.classList.remove("selected"));

    botonPulsado.classList.add("selected");
};
// ==========================================
// 9. EVENTO: COMPROBAR RESPUESTAS
// ==========================================
btnComprobar.addEventListener("click", () => {
    const rondaActualBox = document.getElementById(`round-${rondaActual}`);
    const tarjetas = rondaActualBox.querySelectorAll(".question-card");

    let todasRespondidas = true;
    tarjetas.forEach(tarjeta => {
        if (!tarjeta.querySelector(".option-btn.selected")) {
            todasRespondidas = false;
        }
    });

    if (!todasRespondidas) {
        alert("Debes responder a todas las preguntas de la ronda actual.");
        return;
    }

    let fallosEnEstaRonda = 0;

    tarjetas.forEach(tarjeta => {
        const opcionElegida = tarjeta.querySelector(".option-btn.selected").textContent;
        const opcionCorrecta = tarjeta.dataset.respuestaCorrecta;
        const enunciadoPregunta = tarjeta.querySelector("h4").textContent;

        if (opcionElegida === opcionCorrecta) {
            aciertos++;
        } else {
            fallos++;
            fallosEnEstaRonda++;

            preguntasFalladas.push({
                pregunta: enunciadoPregunta,
                tuRespuesta: opcionElegida,
                correcta: opcionCorrecta
            });
        }

        tarjeta.classList.add("bloqueada");
        
        const badge = document.createElement("div");
        badge.classList.add("badge-respondido");
        badge.textContent = "Respondido";
        tarjeta.appendChild(badge);
    });

    if (fallosEnEstaRonda > 0) {
        mostrarModal("¡Juego terminado!", "Has fallado al menos una pregunta.", false);
    } else if (rondaActual < 2) {
        alert("¡Excelente! Has pasado de ronda.");
        rondaActual++;
        renderizarRonda();
    } else {
        mostrarModal(`¡Felicidades, ${jugador}!`, "¡Has ganado el concurso!", true);
    }
});
// ==========================================
// 10. MODAL Y ENVÍO DE DATOS AL SERVIDOR
// ==========================================
function mostrarModal(titulo, mensaje, haGanado) {
    modalTitle.textContent = titulo;
    modalText.textContent = mensaje;

    // 1. Guardamos el texto base con los aciertos y fallos
    let contenido = `<p class="modal-resumen"><strong>Aciertos:</strong> ${aciertos} | <strong>Fallos:</strong> ${fallos}</p>`;

    // 2. Si el array tiene preguntas falladas, añadimos el desglose
    if (preguntasFalladas.length > 0) {
        contenido += `<div class="fallos-contenedor">`;
        contenido += `<p class="fallos-titulo">Respuestas incorrectas:</p>`;

        preguntasFalladas.forEach(item => {
            contenido += `
                <div class="fallo-item">
                    <p class="fallo-pregunta">${item.pregunta}</p>
                    <p class="fallo-incorrecta">❌ Tu respuesta: ${item.tuRespuesta}</p>
                    <p class="fallo-correcta">✔ Respuesta correcta: ${item.correcta}</p>
                </div>
            `;
        });

        contenido += `</div>`;
    }

    // 3. Inyectamos TODO el contenido dentro del contenedor de estadísticas
    modalStats.innerHTML = contenido;

    // 4. Mostramos el modal en pantalla
    modal.classList.remove("hidden");

    // 5. Enviamos los datos al backend
    enviarDatosBackend(haGanado);
}

async function enviarDatosBackend(haGanado) {
    const payload = {
        jugador: jugador,
        aciertos: aciertos,
        fallos: fallos,
        haGanado: haGanado
    };

    try {
        await fetch("backend.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        console.log("Datos enviados al servidor:", payload);
    } catch (error) {
        console.warn("No se pudo conectar con el backend (simulación en cliente).", error);
    }
}

// ==========================================
// 11. REINICIAR PARTIDA CON NUEVO ORDEN
// ==========================================
modalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    roundsContainer.innerHTML = "";

    rondaActual = 1;
    aciertos = 0;
    fallos = 0;
    preguntasFalladas = [];

    barajarArray(preguntasTotales);

    gameSection.classList.add("hidden");
    landingSection.classList.remove("hidden");
});