let originalData = [];
let filteredData = [];
let seleccionados = JSON.parse(localStorage.getItem("seleccionados")) || [];

// === CARGA JSON LOCAL ===
const urlJSON = "./datos.json"; // archivo JSON local en tu proyecto
fetch(urlJSON)
  .then(response => response.json())
  .then(data => {
    originalData = data;
    filteredData = [...originalData].sort(
      (a, b) => parseFloat(b["vtatucu"] || 0) - parseFloat(a["vtatucu"] || 0)
    );
    document.getElementById("filterSection").style.display = "flex";
    renderTable(filteredData);
  })
  .catch(err => alert("Error al cargar los datos: " + err));

// === FILTRO ===
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function aplicarFiltro() {
  const searchText = searchInput.value.toLowerCase();
  filteredData = originalData
    .filter((row) => (row["Productos"] || "").toLowerCase().includes(searchText))
    .sort((a, b) => parseFloat(b["vtatucu"] || 0) - parseFloat(a["vtatucu"] || 0));
  renderTable(filteredData);
}

searchBtn.addEventListener("click", aplicarFiltro);
searchInput.addEventListener("keydown", (e) => e.key === "Enter" && aplicarFiltro());

// === EXPORTAR TABLA FILTRADA ===
document.getElementById("exportBtn").addEventListener("click", () => {
  if (filteredData.length === 0) return alert("No hay datos para exportar.");
  exportToExcel(filteredData, "datos_filtrados.xlsx");
});

// === RENDER TABLA PRINCIPAL ===
function renderTable(data) {
  const table = document.getElementById("dataTable");
  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = "<tr><td>No hay datos para mostrar</td></tr>";
    return;
  }

  const headers = Object.keys(data[0]);
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.classList.add("header-cell");
    headerRow.appendChild(th);
  });

  const thElegir = document.createElement("th");
  thElegir.textContent = "Elegir";
  thElegir.classList.add("header-cell");
  headerRow.appendChild(thElegir);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach((row) => {
    const tr = document.createElement("tr");
    const estado = (row["Estado"] || "").toLowerCase();
    if (estado === "quiebre") tr.classList.add("quiebre-row");
    else if (estado === "sobrestock") tr.classList.add("sobrestock-row");

    Object.values(row).forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val ?? "";
      tr.appendChild(td);
    });

    // === BOTÓN ELEGIR ===
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    const yaSeleccionado = seleccionados.some((sel) => sel.Productos === row.Productos);
    btn.textContent = yaSeleccionado ? "✔" : "Elegir";
    btn.classList.add("btn-elegir");
    btn.disabled = yaSeleccionado;

    btn.addEventListener("click", () => {
      agregarSeleccion(row);
      btn.textContent = "✔";
      btn.disabled = true;
    });

    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// === GUARDAR EN LOCAL STORAGE ===
function agregarSeleccion(row) {
  if (!seleccionados.some((r) => r.Productos === row.Productos)) {
    seleccionados.push(row);
    localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
  }
}

// === MODAL ===
function crearModal() {
  const modal = document.createElement("div");
  modal.id = "modalSeleccionados";
  modal.classList.add("modal-fade-in");

  modal.innerHTML = `
    <div class="modal-contenido">
      <h3>🛒 Artículos seleccionados (${seleccionados.length})</h3>
      <table id="tablaSeleccionados"></table>
      <div class="modal-buttons">
        <button id="btnVaciar" class="btn-vaciar">🗑 Vaciar selección</button>
        <button id="btnExportarSeleccion" class="btn-exportar">📤 Exportar a Excel</button>
        <button id="btnCerrarModal" class="btn-cerrar">❌ Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  renderTablaSeleccionados();

  document.getElementById("btnCerrarModal").onclick = cerrarModal;
  document.getElementById("btnExportarSeleccion").onclick = () =>
    exportToExcel(seleccionados, "articulos_seleccionados.xlsx");
  document.getElementById("btnVaciar").onclick = vaciarSeleccion;
}

function cerrarModal() {
  const modal = document.getElementById("modalSeleccionados");
  if (modal) modal.remove();
}

function renderTablaSeleccionados() {
  const tabla = document.getElementById("tablaSeleccionados");
  tabla.innerHTML = "";

  if (seleccionados.length === 0) {
    tabla.innerHTML = "<tr><td>No hay artículos seleccionados.</td></tr>";
    return;
  }

  const headers = Object.keys(seleccionados[0]);
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  const thQuitar = document.createElement("th");
  thQuitar.textContent = "Quitar";
  headerRow.appendChild(thQuitar);
  thead.appendChild(headerRow);
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");
  seleccionados.forEach((row, i) => {
    const tr = document.createElement("tr");
    headers.forEach((h) => {
      const td = document.createElement("td");
      td.textContent = row[h] ?? "";
      tr.appendChild(td);
    });

    const tdQuitar = document.createElement("td");
    const btnQuitar = document.createElement("button");
    btnQuitar.textContent = "❌";
    btnQuitar.classList.add("btn-quitar");
    btnQuitar.onclick = () => quitarSeleccion(i);
    tdQuitar.appendChild(btnQuitar);
    tr.appendChild(tdQuitar);

    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
}

// === FUNCIONES AUXILIARES ===
function exportToExcel(datos, nombreArchivo) {
  if (datos.length === 0) return alert("No hay datos para exportar.");
  try {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, nombreArchivo);
  } catch (err) {
    alert("Error al exportar a Excel: " + err.message);
  }
}

function quitarSeleccion(index) {
  seleccionados.splice(index, 1);
  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
  renderTablaSeleccionados();
}

function vaciarSeleccion() {
  if (confirm("¿Seguro que querés vaciar toda la selección?")) {
    seleccionados = [];
    localStorage.removeItem("seleccionados");
    renderTablaSeleccionados();
  }
}

// === BOTÓN VER SELECCIONADOS ===
const btnVerSeleccion = document.createElement("button");
btnVerSeleccion.textContent = "🧾 Ver Seleccionados";
btnVerSeleccion.classList.add("btn-ver-seleccionados");
btnVerSeleccion.onclick = crearModal;
document.getElementById("filterSection").appendChild(btnVerSeleccion);