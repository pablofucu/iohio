# GM² · El Puto Circo

Versión web interactiva del *Expediente Forense de El Puto Circo: Anatomía Completa de Daniel Bruno (GM / Perchita / El Prensas)*.

Es una página estática (HTML + CSS + JS, sin compilación), pensada primero para móvil, con tema claro y oscuro.

## Secciones

| Sección | Qué hay |
| --- | --- |
| **Inicio** | El caso en 10 segundos, accesos a cada sección, los 7 grandes episodios, el prólogo y la conclusión |
| **Timeline** | Los 144 incidentes en orden, con exilios, episodios, la expulsión y el epílogo; mapa de calor por meses y filtros |
| **Incidentes** | Glosario buscable con filtros por año, veredicto, rival y categoría; cada incidente abre su ficha |
| **Estadísticas** | Volumen de mensajes, récords, Hora Vampiro y "¿tenía razón?" |
| **Rivales** | Mapa de rivalidades y ficha de cada integrante |
| **El GM** | Gustos (Helldivers, Smite, Minecraft, Monster, radler…), apodos, Diccionario Perchita, el Ciclo y los 8 patrones |

Se puede enlazar directamente a una sección (`#timeline`), a un incidente (`#INC-077`) o a un episodio (`#EP-3`).

## Ver la página

- **Un solo archivo:** `gm2-el-puto-circo.html` lleva todo dentro (también las imágenes). Se abre directamente con el navegador.
- **En local:** sirve la carpeta con `python3 -m http.server` y entra en `http://localhost:8000`.
- **GitHub Pages:** *Settings → Pages → Deploy from a branch*. Si el repositorio es público, la página también lo será.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Estructura y texto del dossier |
| `css/styles.css` | Estilos, temas y animaciones |
| `js/main.js` | Navegación, timeline, catálogo, fichas y gráficos |
| `js/data.js` | Los 144 incidentes, generados desde el `.md` (`python3 tools/build_data.py`) |
| `js/content.js` | Los 7 grandes episodios y los hitos del timeline (texto literal del dossier) |
| `assets/img/` | Logos (Monster, radler, Helldivers 2, Smite, mochila de Minecraft) |
| `tools/build_single.py` | Regenera `gm2-el-puto-circo.html` |
| `tools/process_images.py` | Quita el fondo blanco a los logos y los exporta a webp |
| `tools/dossier_daniel_bruno.md` | Documento original |
