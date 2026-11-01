// Utiliza la API pública y sin restricciones de Studio Ghibli:
// https://ghibliapi.vercel.app/films


const URL_API = "https://ghibliapi.vercel.app/films";

const spanTotal = document.querySelector("#total-peliculas");
const spanMedia = document.querySelector("#nota-media");
const spanMax = document.querySelector("#pelicula-max");
const spanMin = document.querySelector("#pelicula-min");

const contenedorBuscador = document.querySelector("#contenedor-buscador");
const entradaBusqueda = document.querySelector("#entrada-busqueda");
const listaSugerencias = document.querySelector("#lista-sugerencias");
const selectGenero = document.querySelector("#filtro-genero");
const btnReset = document.querySelector("#btn-reset");

const escaparate = document.querySelector("#escaparate");
const formulario = document.querySelector("#formulario-pelicula");
const btnCrear = document.querySelector("#btn-crear");

let peliculas = [];

// 1. GESTIÓN DE DATOS

async function obtenerPeliculasAPI(url) {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    const generosDemo = ["Animación", "Fantasía", "Aventura", "Drama"];
    return datos.slice(0, 12).map((item, indice) => ({
        id: String(item.id),
        titulo: item.title,
        sinopsis: item.description,
        genero: generosDemo[indice % generosDemo.length],
        valoracion: Number((Number(item.rt_score) / 10).toFixed(1)),
        cartel: item.image
    }));
}

async function crearPeliculaAPI(url, nuevaPelicula) {
    const respuesta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaPelicula)
    });
    return respuesta;
}

async function eliminarPeliculaAPI(url, id) {
    const respuesta = await fetch(`${url}/${id}`, {
        method: "DELETE"
    });
    return respuesta;
}


// 2. PROCESAMIENTO DE DATOS 

function actualizarEstadisticas(lista) {
    if (lista.length === 0) {
        spanTotal.textContent = "0";
        spanMedia.textContent = "0.0";
        spanMax.textContent = "-";
        spanMin.textContent = "-";
        return;
    }

   
    spanTotal.textContent = lista.length;

    const sumaNotas = lista.reduce((acumulado, peli) => acumulado + peli.valoracion, 0);
    const media = (sumaNotas / lista.length).toFixed(2);
    spanMedia.textContent = media;

    const notas = lista.map((peli) => peli.valoracion);
    const notaMaxima = Math.max(...notas);
    const notaMinima = Math.min(...notas);

    const peliMax = lista.find((peli) => peli.valoracion === notaMaxima);
    const peliMin = lista.find((peli) => peli.valoracion === notaMinima);

    spanMax.textContent = `${peliMax.titulo} (${notaMaxima})`;
    spanMin.textContent = `${peliMin.titulo} (${notaMinima})`;
}

function actualizarSelectGeneros(lista) {
    const seleccionActual = selectGenero.value;

    const generosUnicos = [...new Set(lista.map((peli) => peli.genero))];

    selectGenero.replaceChildren();

    const opcionTodos = document.createElement("option");
    opcionTodos.value = "todos";
    opcionTodos.textContent = `Todos los géneros (${lista.length})`;
    selectGenero.appendChild(opcionTodos);

    for (const genero of generosUnicos) {
        const cantidad = lista.filter((peli) => peli.genero === genero).length;
        const opcion = document.createElement("option");
        opcion.value = genero;
        opcion.textContent = `${genero} (${cantidad})`;
        selectGenero.appendChild(opcion);
    }

    if (generosUnicos.includes(seleccionActual)) {
        selectGenero.value = seleccionActual;
    }
}

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .trim();
}

// 3. CREACIÓN DINÁMICA DE ELEMENTOS Y REPRESENTACIÓN EN EL DOM

function creaTarjeta(pelicula) {
    const article = document.createElement("article");
    article.classList.add("tarjeta");
    article.dataset.id = pelicula.id;

    const img = document.createElement("img");
    img.classList.add("tarjeta-imagen");
    img.src = pelicula.cartel;
    img.alt = `Cartel de ${pelicula.titulo}`;

    const cuerpo = document.createElement("div");
    cuerpo.classList.add("tarjeta-cuerpo");

    const cabecera = document.createElement("div");
    cabecera.classList.add("tarjeta-cabecera");

    const titulo = document.createElement("h3");
    titulo.classList.add("tarjeta-titulo");
    titulo.textContent = pelicula.titulo;

    const nota = document.createElement("span");
    nota.classList.add("tarjeta-nota");
    nota.textContent = `★ ${pelicula.valoracion}`;

    cabecera.appendChild(titulo);
    cabecera.appendChild(nota);

    const genero = document.createElement("span");
    genero.classList.add("tarjeta-genero");
    genero.textContent = pelicula.genero;

    const sinopsis = document.createElement("p");
    sinopsis.classList.add("tarjeta-sinopsis");
    sinopsis.textContent = pelicula.sinopsis;

    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn-eliminar");
    btnEliminar.textContent = "Eliminar";

    cuerpo.appendChild(cabecera);
    cuerpo.appendChild(genero);
    cuerpo.appendChild(sinopsis);
    cuerpo.appendChild(btnEliminar);

    article.appendChild(img);
    article.appendChild(cuerpo);

    return article;
}

function mostrarCatalogo(lista) {
    escaparate.replaceChildren();

    for (const pelicula of lista) {
        const tarjeta = creaTarjeta(pelicula);
        escaparate.appendChild(tarjeta);
    }
}

function refrescarInterfaz() {
    actualizarEstadisticas(peliculas);
    actualizarSelectGeneros(peliculas);

    const generoSeleccionado = selectGenero.value;
    const listaFiltrada =
        generoSeleccionado === "todos"
            ? peliculas
            : peliculas.filter((p) => p.genero === generoSeleccionado);

    mostrarCatalogo(listaFiltrada);
}

// 4. GESTIÓN DE EVENTOS: AUTOCOMPLETADO, DELEGACIÓN Y FORMULARIO

entradaBusqueda.addEventListener("input", () => {
    const texto = normalizarTexto(entradaBusqueda.value);

    if (texto.length < 3) {
        listaSugerencias.hidden = true;
        listaSugerencias.replaceChildren();
        return;
    }

    const coincidencias = peliculas
        .filter((peli) => normalizarTexto(peli.titulo).includes(texto))
        .slice(0, 7);

    listaSugerencias.replaceChildren();

    if (coincidencias.length === 0) {
        const liVacio = document.createElement("li");
        liVacio.classList.add("sugerencia-vacia");
        liVacio.textContent = "No se encontraron películas";
        listaSugerencias.appendChild(liVacio);
    } else {
        for (const peli of coincidencias) {
            const li = document.createElement("li");
            li.classList.add("sugerencia-item");
            li.dataset.id = peli.id;
            li.textContent = `${peli.titulo} (${peli.genero})`;
            listaSugerencias.appendChild(li);
        }
    }

    listaSugerencias.hidden = false;
});

listaSugerencias.addEventListener("click", (e) => {
    const item = e.target.closest(".sugerencia-item");
    if (!item) return;

    const idSeleccionado = item.dataset.id;
    const peliculaElegida = peliculas.find((peli) => peli.id === idSeleccionado);

    if (peliculaElegida) {
        entradaBusqueda.value = peliculaElegida.titulo;
        listaSugerencias.hidden = true;
        mostrarCatalogo([peliculaElegida]);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        listaSugerencias.hidden = true;
    }
});

document.addEventListener("click", (e) => {
    if (!contenedorBuscador.contains(e.target)) {
        listaSugerencias.hidden = true;
    }
});

selectGenero.addEventListener("change", () => {
    entradaBusqueda.value = "";
    refrescarInterfaz();
});

btnReset.addEventListener("click", () => {
    entradaBusqueda.value = "";
    selectGenero.value = "todos";
    refrescarInterfaz();
});

escaparate.addEventListener("click", async (e) => {
    const boton = e.target;
    if (!boton.classList.contains("btn-eliminar")) return;

    const tarjeta = boton.closest(".tarjeta");
    const idPelicula = tarjeta.dataset.id;

    try {
        await eliminarPeliculaAPI(URL_API, idPelicula);
    } catch (error) {
        console.error("Error al eliminar la película.", error);
    }

    peliculas = peliculas.filter((peli) => peli.id !== idPelicula);
    refrescarInterfaz();
});

btnCrear.addEventListener("click", async () => {

    const datosFormulario = new FormData(formulario);
    const objeto = Object.fromEntries(datosFormulario);

    const nuevaPelicula = {
        id: String(Date.now()),
        titulo: objeto.titulo.trim(),
        genero: objeto.genero,
        valoracion: Number(objeto.valoracion),
        cartel: objeto.cartel.trim(),
        sinopsis: objeto.sinopsis.trim()
    };

    try {
        await crearPeliculaAPI(URL_API, nuevaPelicula);
    } catch (error) {
        console.error("Error al crear la película.", error);
    }

    peliculas.unshift(nuevaPelicula);
    formulario.reset();
    refrescarInterfaz();
});


peliculas = await obtenerPeliculasAPI(URL_API);
refrescarInterfaz();