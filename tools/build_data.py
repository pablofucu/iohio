"""Extrae el catálogo de incidentes del dossier .md y genera js/data.js"""
import json, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
md = (root / "tools" / "dossier_daniel_bruno.md").read_text(encoding="utf-8")
groups, cur = [], None
for line in md.splitlines():
    m = re.match(r"^### (.*\(INC-\d+ a INC-\d+\).*)$", line)
    if m:
        cur = {"title": m.group(1).strip(), "items": []}
        groups.append(cur); continue
    if line.startswith("| `INC-") and cur is not None:
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        assert len(cells) == 7, (len(cells), line)
        iid, date, name, cat, riv, ver, desc = cells
        v = "S" if "🟢" in ver else "P" if "🟡" in ver else "N"
        rivals = re.findall(r"[A-ZÁÉÍÓÚÑ]{3,}", riv)
        cur["items"].append({
            "id": iid.strip("`"), "date": date.strip("`"),
            "name": name.strip("*"), "cat": cat, "riv": riv, "main": rivals[0],
            "all": rivals, "v": v, "desc": desc})
n = sum(len(g["items"]) for g in groups)
assert n == 144, n
(root / "js" / "data.js").write_text("window.INCIDENTS = " + json.dumps(groups, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(n, [len(g["items"]) for g in groups])
