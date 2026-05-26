/* ========== VARIABLES GLOBALES Y CONFIGURACIÓN ========== */

// URL de la API de películas de Studio Ghibli - Endpoint que proporciona todas las películas
const URL_API = 'https://ghibliapi.vercel.app/films';

// Array global que almacena TODAS las películas cargadas de la API (nunca cambia)
let todasLasPeliculas = [];

// Array global que almacena las películas FILTRADAS según la búsqueda del usuario
let peliculasFiltradas = [];

/* ========== REFERENCIAS A ELEMENTOS DEL DOM ========== */

// Referencia al contenedor principal donde se mostrarán las tarjetas de películas
const contenedorPeliculas = document.getElementById('contenedorPeliculas');

// Referencia al campo de entrada de texto donde el usuario escribe para buscar
const entradaBusqueda = document.getElementById('entradaBusqueda');

// Referencia al botón que activa la función de búsqueda
const botonBuscar = document.getElementById('botonBuscar');

// Referencia al indicador de carga (spinner) que aparece mientras se cargan las películas
const divCargando = document.getElementById('cargando');

// Referencia al modal (ventana emergente) que muestra detalles de películas
const modal = document.getElementById('modal');

// Referencia al botón X para cerrar el modal
const botonCerrar = document.querySelector('.cerrar');

// Referencia al contenedor del cuerpo del modal donde se muestran los detalles
const cuerpoModal = document.getElementById('cuerpoModal');

/* ========== INICIALIZACIÓN AL CARGAR LA PÁGINA ========== */

// Se ejecuta cuando el DOM está completamente cargado y listo para ser manipulado
document.addEventListener('DOMContentLoaded', () => {
    // Carga todas las películas desde la API de Studio Ghibli
    cargarPeliculas();
    // Configura todos los escuchadores de eventos (clicks, Enter, etc.)
    configurarEventos();
});

/* ========== CONFIGURACIÓN DE EVENTOS ========== */

// Función que configura todos los escuchadores de eventos (event listeners) de la aplicación
function configurarEventos() {
    // Escucha el evento de CLIC en el botón buscar y ejecuta la función realizarBusqueda
    botonBuscar.addEventListener('click', realizarBusqueda);
    
    // Escucha cuando se presiona cualquier tecla en el campo de búsqueda
    entradaBusqueda.addEventListener('keypress', (evento) => {
        // Si la tecla presionada es Enter (retorno), ejecuta la búsqueda
        if (evento.key === 'Enter') realizarBusqueda();
    });

    // Escucha el evento de CLIC en el botón X para cerrar el modal
    botonCerrar.addEventListener('click', cerrarModal);
    
    // Escucha el evento de CLIC en el modal (la ventana emergente completa)
    modal.addEventListener('click', (evento) => {
        // Si se hace clic en el fondo oscuro (no en el contenido), cierra el modal
        // evento.target es el elemento donde se hizo clic
        // Solo cierra si se hizo clic en el modal mismo, no en su contenido
        if (evento.target === modal) cerrarModal();
    });
}

/* ========== CARGA DE DATOS DESDE LA API ========== */

// Función asincrónica (async) para cargar las películas de la API de Studio Ghibli
// async permite usar 'await' para esperar promesas
async function cargarPeliculas() {
    try {
        // Muestra el indicador de carga (spinner) para que el usuario sepa que está cargando
        divCargando.style.display = 'block';
        
        // Realiza una solicitud HTTP a la API usando fetch
        // await espera a que se complete la solicitud antes de continuar
        const respuesta = await fetch(URL_API);
        
        // Verifica si la respuesta fue exitosa (código HTTP 200-299)
        // respuesta.ok es true si el código de estado está entre 200-299
        if (!respuesta.ok) {
            // Si hay error HTTP, crea una excepción personalizada
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        // Convierte la respuesta JSON (texto) a un objeto/array de JavaScript
        // await espera a que se procese el JSON
        todasLasPeliculas = await respuesta.json();
        
        // Copia todas las películas al array peliculasFiltradas usando spread operator (...)
        // Esto crea una copia independiente, no una referencia
        peliculasFiltradas = [...todasLasPeliculas];
        
        // Registra en la consola del navegador cuántas películas se cargaron correctamente
        console.log('Películas cargadas:', todasLasPeliculas.length);
        
        // Llama a la función para mostrar las películas en la pantalla
        mostrarPeliculas(peliculasFiltradas);
        
    } catch (error) {
        // El bloque catch captura cualquier error que ocurra en el try
        // Muestra el error en la consola del navegador para debugging
        console.error('Error al cargar la API:', error);
        // Llama a la función que muestra un mensaje de error amigable al usuario
        mostrarError('No se pudieron cargar las películas. Intenta recargar la página.');
    } finally {
        // El bloque finally SIEMPRE se ejecuta, independientemente de si hay error o no
        // Oculta el indicador de carga después de intentar cargar
        divCargando.style.display = 'none';
    }
}

/* ========== MOSTRAR PELÍCULAS EN PANTALLA ========== */

// Función que renderiza (dibuja) todas las películas en el contenedor del DOM
function mostrarPeliculas(películas) {
    // Verifica si el array de películas está vacío o no existe
    if (!películas || películas.length === 0) {
        // Si no hay películas, muestra un mensaje de "Sin resultados"
        contenedorPeliculas.innerHTML = `
            <div class="estado-vacio" style="grid-column: 1/-1;">
                <h2>Sin resultados</h2>
                <p>No encontramos películas que coincidan.</p>
            </div>
        `;
        // sale de la función sin crear tarjetas
        return;
    }

    // Usa el método .map() para recorrer cada película y crear una tarjeta HTML
    // .map() transforma cada elemento del array en un string HTML
    // .join('') une todos los strings sin separador
    contenedorPeliculas.innerHTML = películas.map(pelicula => `
        <!-- Contenedor de la tarjeta individual de película con evento onclick -->
        <div class="tarjeta-pelicula" onclick="abrirModal('${pelicula.id}'); return false;">
            <!-- Imagen de portada de la película (usada como fondo) -->
            <div class="cartel-pelicula" style="background-image: url('${pelicula.image}'); background-size: cover; background-position: center;"></div>
            <!-- Información de la película mostrada debajo de la imagen -->
            <div class="info-pelicula">
                <!-- Título limpio (sin HTML) de la película -->
                <h3 class="titulo-pelicula">${limpiarHTML(pelicula.title)}</h3>
                <!-- Año de lanzamiento - muestra 'N/A' si no está disponible -->
                <p class="anio-pelicula">${pelicula.release_date || 'N/A'}</p>
                <!-- Nombre del director limpio (sin HTML) -->
                <p class="director-pelicula">${limpiarHTML(pelicula.director)}</p>
                <!-- Descripción acortada a 100 caracteres con puntos suspensivos -->
                <p class="descripcion-pelicula">${truncarTexto(pelicula.description, 100)}</p>
                <!-- Botón para abrir el modal con detalles completos -->
                <button class="ver-detalles" onclick="abrirModal('${pelicula.id}'); event.stopPropagation(); return false;">Ver detalles</button>
            </div>
        </div>
    `).join('');
    // .join('') convierte el array resultante de map en un único string sin separadores
}

/* ========== FUNCIÓN DE BÚSQUEDA ========== */

// Función que filtra las películas según el texto que ingresa el usuario
function realizarBusqueda() {
    // Obtiene el valor del campo de entrada
    // .value lee lo que escribió el usuario
    // .toLowerCase() convierte a minúsculas para búsqueda sin distinción de mayúsculas
    // .trim() elimina espacios en blanco al inicio y final
    const terminoBusqueda = entradaBusqueda.value.toLowerCase().trim();

    // Si el usuario no escribió nada (campo vacío), muestra todas las películas
    if (terminoBusqueda === '') {
        // Copia todas las películas nuevamente
        peliculasFiltradas = [...todasLasPeliculas];
    } else {
        // Si hay texto de búsqueda, filtra las películas
        // El método .filter() retorna un nuevo array con solo las películas que cumplen la condición
        peliculasFiltradas = todasLasPeliculas.filter(pelicula => {
            // Obtiene el título en minúsculas (o cadena vacía si no existe)
            const titulo = (pelicula.title || '').toLowerCase();
            // Obtiene el director en minúsculas (o cadena vacía si no existe)
            const director = (pelicula.director || '').toLowerCase();
            
            // BÚSQUEDA MEJORADA: Solo muestra películas donde COMIENZA el término
            // en título o director (más relevantes), descarta descripción para evitar falsas coincidencias
            
            // Busca al INICIO del TÍTULO (máxima prioridad)
            const tituloComienzo = titulo.startsWith(terminoBusqueda);
            
            // O busca al INICIO del DIRECTOR (alta prioridad)
            const directorComienzo = director.startsWith(terminoBusqueda);
            
            // O si no está al inicio, busca dentro del TÍTULO (media prioridad)
            const tituloIncluye = titulo.includes(terminoBusqueda) && !titulo.startsWith(terminoBusqueda);
            
            // Retorna true si alguna condición se cumple
            return tituloComienzo || directorComienzo || tituloIncluye;
        });
    }

    // Llama a mostrarPeliculas para renderizar el resultado de la búsqueda
    mostrarPeliculas(peliculasFiltradas);
}

/* ========== MODAL Y DETALLES DE PELÍCULA ========== */

// Función que abre el modal y muestra los detalles completos de una película
function abrirModal(idPelicula) {
    // Registra en la consola el ID de la película que se va a mostrar (para debugging)
    console.log('Abriendo modal para:', idPelicula);
    
    // Busca la película con ese ID específico en el array todasLasPeliculas
    // El método .find() retorna el PRIMER elemento que cumple la condición (p.id === idPelicula)
    const pelicula = todasLasPeliculas.find(p => p.id === idPelicula);
    
    // Si .find() no encuentra la película, retorna undefined
    // En ese caso, no hace nada y sale de la función
    if (!pelicula) {
        console.log('Película no encontrada:', idPelicula);
        return;
    }

    // Genera todo el contenido HTML del modal con detalles completos de la película
    // Usa template literals (backticks) para insertar datos dinámicamente
    cuerpoModal.innerHTML = `
        <!-- Banner superior de la película (imagen de fondo grande) - Se muestra solo si existe -->
        ${pelicula.movie_banner ? `<div class="banner-pelicula" style="background-image: url('${pelicula.movie_banner}'); background-size: cover; background-position: center; height: 250px; margin: -30px -30px 20px -30px; border-radius: 15px 15px 0 0;"></div>` : ''}
        
        <!-- Contenedor principal con imagen y datos principales (lado a lado) -->
        <div style="display: flex; gap: 20px; align-items: flex-start;">
            <!-- Imagen de portada de la película -->
            ${pelicula.image ? `<img src="${pelicula.image}" alt="${limpiarHTML(pelicula.title)}" style="width: 160px; height: 240px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); flex-shrink: 0;">` : ''}
            <!-- Sección derecha con título, año de estreno y puntuación -->
            <div style="flex: 1;">
                <!-- Título principal de la película limpio de HTML -->
                <h2 style="margin: 0 0 10px 0; font-size: 1.8rem;">${limpiarHTML(pelicula.title)}</h2>
                <!-- Badges (etiquetas decorativas) con año y puntuación -->
                <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
                    <!-- Badge rojo con el año de lanzamiento -->
                    <span style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${pelicula.release_date || 'N/A'}</span>
                    <!-- Badge naranja con puntuación (solo si existe) -->
                    ${pelicula.rt_score ? `<span style="background: #f39c12; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">⭐ ${pelicula.rt_score}/100</span>` : ''}
                </div>
            </div>
        </div>

        <!-- Sección: Título Original en Japonés -->
        <div class="detalle-modal">
            <strong>Título Original:</strong>
            <p>${limpiarHTML(pelicula.original_title) || 'No disponible'}</p>
        </div>

        <!-- Sección: Título Romanizado (caracteres latinos) -->
        <div class="detalle-modal">
            <strong>Título Romanizado:</strong>
            <p>${limpiarHTML(pelicula.original_title_romanised) || 'No disponible'}</p>
        </div>

        <!-- Sección: Información del Director -->
        <div class="detalle-modal">
            <strong>Director:</strong>
            <p>${limpiarHTML(pelicula.director) || 'No disponible'}</p>
        </div>

        <!-- Sección: Información del Productor -->
        <div class="detalle-modal">
            <strong>Productor:</strong>
            <p>${limpiarHTML(pelicula.producer) || 'No disponible'}</p>
        </div>

        <!-- Sección: Duración en minutos -->
        <div class="detalle-modal">
            <strong>Duración:</strong>
            <p>${pelicula.running_time ? pelicula.running_time + ' minutos' : 'No disponible'}</p>
        </div>

        <!-- Sección: Compositor de la música (soundtrack) -->
        <div class="detalle-modal">
            <strong>Compositor:</strong>
            <p>${limpiarHTML(pelicula.composer) || 'No disponible'}</p>
        </div>

        <!-- Sección: Descripción completa y detallada de la película -->
        <div class="detalle-modal">
            <strong>Descripción:</strong>
            <p>${limpiarHTML(pelicula.description) || 'No disponible'}</p>
        </div>
    `;

    // Añade la clase CSS 'show' al elemento modal para hacerlo visible
    // Esta clase probablemente cambia display: none a display: block en el CSS
    modal.classList.add('show');
    // Registra en la consola que el modal se abrió exitosamente
    console.log('Modal mostrado');
}

// Función que cierra el modal ocultándolo de la pantalla
function cerrarModal() {
    // Elimina la clase CSS 'show' del elemento modal
    // Sin esta clase, el modal vuelve a estar oculto (display: none)
    modal.classList.remove('show');
}

/* ========== FUNCIONES AUXILIARES (UTILITY FUNCTIONS) ========== */

// Función que acorta un texto a una cantidad máxima de caracteres
// Se usa para mostrar solo un preview de la descripción
function truncarTexto(texto, longitud) {
    // Si el parámetro texto es null o undefined, retorna un mensaje default
    if (!texto) return 'Sin descripción';
    
    // Si la longitud del texto es MAYOR que el límite especificado
    if (texto.length > longitud) {
        // Retorna los primeros 'longitud' caracteres más puntos suspensivos
        // .substring(0, longitud) extrae caracteres del índice 0 hasta longitud (no incluye longitud)
        return texto.substring(0, longitud) + '...';
    }
    // Si el texto cabe completamente, lo retorna sin modificar
    return texto;
}

// Función que elimina código HTML malicioso del texto para evitar inyecciones (XSS attacks)
// Por ejemplo: <script>alert('hacked')</script> se convierte en texto plano
function limpiarHTML(texto) {
    // Si el parámetro texto es null o undefined, retorna vacío
    if (!texto) return '';
    
    // Crea un elemento DIV temporal en memoria (no aparece en la página)
    const div = document.createElement('div');
    
    // Asigna el texto como contenido de TEXTO (no HTML)
    // textContent solo permite texto plano, ignora cualquier HTML
    // Esto es la clave para sanitizar entrada maliciosa
    div.textContent = texto;
    
    // Retorna el innerHTML del div
    // Ahora contiene solo el texto, sin etiquetas HTML peligrosas
    return div.innerHTML;
}

// Función que muestra un mensaje de error en la pantalla
// Se utiliza cuando falla la carga de datos o algo sale mal
function mostrarError(mensaje) {
    // Limpia el contenedor de películas eliminando cualquier contenido anterior
    // y genera HTML con el contenedor de estado vacío para mostrar el error
    contenedorPeliculas.innerHTML = `
        <div class="estado-vacio" style="grid-column: 1/-1;">
            <!-- Contenedor de estado vacío que ocupa toda la fila (1/-1 significa desde primera hasta última columna) -->
            
            <h2>Error</h2>
            <!-- Título de error en tamaño grande para que sea notorio -->
            
            <p>${mensaje}</p>
            <!-- Párrafo que muestra el mensaje de error que recibe la función como parámetro -->
            <!-- El ${mensaje} se reemplaza con el texto pasado a la función (ej: "No se pudieron cargar las películas") -->
            
        </div>
    `;
}

/* ========== EVENTO GLOBAL DEL TECLADO ========== */

// Escucha GLOBALMENTE cuando se presiona cualquier tecla en el teclado
document.addEventListener('keydown', (evento) => {
    // Verifica si la tecla presionada fue ESC (Escape)
    // evento.key contiene el nombre de la tecla presionada
    if (evento.key === 'Escape') {
        // Cierra el modal cuando el usuario presiona ESC
        cerrarModal();
    }
});