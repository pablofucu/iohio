"""Genera gm2-el-puto-circo.html: la web completa en un solo archivo (CSS, JS, datos e imágenes incrustados)."""
import base64, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/styles.css").read_text(encoding="utf-8")
imgs = {p.stem: "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode() for p in sorted((root / "assets/img").glob("*.webp"))}

def embed_paths(text):
    return re.sub(r"assets/img/([a-z0-9-]+)\.webp", lambda m: imgs[m.group(1)], text)

def js(name):
    return (root / "js" / name).read_text(encoding="utf-8").replace("</script", "<\\/script")

html = html.replace('<link rel="stylesheet" href="css/styles.css">', "<style>\n" + css + "\n</style>")
scripts = '<script src="js/data.js"></script>\n<script src="js/content.js"></script>\n<script src="js/chats.js"></script>\n<script src="js/main.js"></script>'
assert scripts in html
# el mapa de imágenes va en una variable para no repetir los datos en cada <img>
img_map = "window.GM_IMG = {" + ",".join(f'"{k}":"{v}"' for k, v in imgs.items()) + "};"
inline = "<script>\n" + img_map + "\n" + js("data.js") + "\n" + js("content.js") + "\n" + js("chats.js") + "\n</script>\n<script>\n" + js("main.js") + "\n</script>"
html = html.replace(scripts, "@@SCRIPTS@@")
# <img src="assets/img/x.webp"> → data-img="x"; un script rellena el src desde GM_IMG
html = re.sub(r'src="assets/img/([a-z0-9-]+)\.webp"', r'data-img="\1"', html)
inline = inline.replace("<script>\n" + js("main.js"), "<script>document.querySelectorAll('img[data-img]').forEach(function(i){i.src=GM_IMG[i.dataset.img]});</script>\n<script>\n" + js("main.js"), 1)
html = embed_paths(html)
html = html.replace("@@SCRIPTS@@", inline)
assert "assets/img/" not in html.replace("`assets/img/${n}.webp`", "")
out = root / "gm2-el-puto-circo.html"
out.write_text(html, encoding="utf-8")
print(out.name, round(out.stat().st_size / 1024), "KB")
