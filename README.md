# GM² · El Puto Circo

Versión web interactiva del *Expediente Forense de El Puto Circo: Anatomía Completa de Daniel Bruno (GM / Perchita / El Prensas)*.

Es una página estática (HTML + CSS + JS, sin compilación), pensada primero para móvil.

## Ver la página

- **En local:** abre `index.html` en el navegador, o sirve la carpeta con `python3 -m http.server` y entra en `http://localhost:8000`.
- **GitHub Pages:** *Settings → Pages → Deploy from a branch* y elige la rama y la carpeta raíz. Si el repositorio es público, la página también lo será.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Todo el texto del dossier y las ilustraciones SVG (lata, radler, Smite, Helldivers, Minecraft…) |
| `css/styles.css` | Estilos y animaciones |
| `js/main.js` | Interacciones: contadores, gráficos, ciclo Perchita, catálogo con filtros, easter eggs |
| `js/data.js` | Los 144 incidentes, generados automáticamente a partir del `.md` |
| `tools/dossier_daniel_bruno.md` | Documento original |
| `tools/build_data.py` | Regenera `js/data.js` desde el `.md`: `python3 tools/build_data.py` |
