// Lecture et écriture des projets (src/data/projects.json) et de leurs photos
// (public/images/projects/<id>/). Utilisé par la commande `npm run add-project`
// et par l'espace admin. Aucune dépendance : uniquement des modules Node.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_FILE = path.join(ROOT, "src", "data", "projects.json");
export const IMAGES_DIR = path.join(ROOT, "public", "images", "projects");
export const IMAGES_URL = "/images/projects";

const TONES = ["g1", "g2", "g3", "g4", "g5", "g6"];
const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "projet";

export function readProjects() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("le fichier doit contenir une liste");
    return list;
  } catch (err) {
    // On refuse d'écraser un fichier abîmé : il faut d'abord le réparer.
    throw new Error(`projects.json est invalide (${err.message}). Corrigez-le avant de continuer.`);
  }
}

function writeProjects(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
}

const cleanList = (value) =>
  (Array.isArray(value) ? value : [])
    .map((v) => String(v).trim())
    .filter(Boolean);

const cleanText = (value) => (value == null ? "" : String(value).trim());

// Lien web : on n'accepte que http(s). Sans préfixe, "https://" est ajouté ; sinon le lien est ignoré.
const cleanUrl = (value) => {
  let t = cleanText(value);
  if (!t) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  return /^https?:\/\/[^\s]+$/i.test(t) ? t : "";
};

// Un id ne contient que des lettres minuscules, chiffres et tirets : il sert de nom de dossier.
const validId = (id) => typeof id === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);

function projectDir(id) {
  if (!validId(id)) throw new Error("Identifiant de projet invalide.");
  return path.join(IMAGES_DIR, id);
}

function pickTone(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

function uniqueId(base, list, ownId) {
  let id = base;
  let n = 2;
  while (list.some((p) => p.id === id && p.id !== ownId)) id = `${base}-${n++}`;
  return id;
}

// Transforme une photo reçue (data URL envoyée par l'admin, ou fichier lu par la commande) en fichier.
function writeImage(id, img) {
  let buffer;
  let ext;
  if (img.dataUrl) {
    const m = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i.exec(img.dataUrl);
    if (!m) throw new Error("Image invalide.");
    ext = m[1].toLowerCase().replace("jpeg", "jpg").replace("svg+xml", "svg");
    buffer = Buffer.from(m[2], "base64");
  } else if (img.buffer) {
    ext = String(img.ext || "").toLowerCase().replace("jpeg", "jpg");
    buffer = img.buffer;
  } else {
    throw new Error("Image vide.");
  }
  if (!EXTENSIONS.has(ext === "jpg" ? "jpg" : ext)) throw new Error(`Format d'image non pris en charge : ${ext}`);

  const dir = projectDir(id);
  fs.mkdirSync(dir, { recursive: true });
  const file = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  fs.writeFileSync(path.join(dir, file), buffer);
  return `${IMAGES_URL}/${id}/${file}`;
}

function removeImageFile(url) {
  const rel = String(url).replace(/^\/images\/projects\//, "");
  const target = path.resolve(IMAGES_DIR, rel);
  // Sécurité : on ne supprime que ce qui se trouve dans le dossier des photos de projets.
  if (!target.startsWith(IMAGES_DIR + path.sep)) return;
  fs.rmSync(target, { force: true });
}

/**
 * Crée ou met à jour un projet.
 * input: { id?, title, category, subtitle, meta, description, features[], tech[], liveUrl, codeUrl,
 *          images[] (photos déjà enregistrées à garder), newImages[] (photos à ajouter), color? }
 */
export function upsertProject(input) {
  const title = cleanText(input.title);
  if (!title) throw new Error("Le titre est obligatoire.");

  const list = readProjects();
  const existing = input.id ? list.find((p) => p.id === input.id) : null;
  const id = existing ? existing.id : uniqueId(slugify(title), list);

  // Photos conservées : uniquement celles qui appartiennent bien à ce projet
  const prefix = `${IMAGES_URL}/${id}/`;
  const kept = cleanList(input.images).filter((u) => u.startsWith(prefix) && !u.includes(".."));
  const added = (input.newImages || []).map((img) => writeImage(id, img));
  const images = [...kept, ...added];

  if (existing) {
    for (const old of existing.images || []) if (!images.includes(old)) removeImageFile(old);
  }

  const project = {
    id,
    title,
    category: cleanText(input.category) || "Projets",
    subtitle: cleanText(input.subtitle),
    meta: cleanText(input.meta),
    description: cleanText(input.description),
    features: cleanList(input.features),
    tech: cleanList(input.tech),
    liveUrl: cleanUrl(input.liveUrl),
    codeUrl: cleanUrl(input.codeUrl),
    images,
    color: (existing && existing.color) || input.color || pickTone(id),
  };

  if (existing) list[list.indexOf(existing)] = project;
  else list.unshift(project); // un nouveau projet apparaît en premier
  writeProjects(list);
  return project;
}

export function deleteProject(id) {
  const list = readProjects();
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) throw new Error("Projet introuvable.");
  writeProjects(next);
  fs.rmSync(projectDir(id), { recursive: true, force: true });
  return next;
}

export function reorderProjects(ids) {
  const list = readProjects();
  const byId = new Map(list.map((p) => [p.id, p]));
  const ordered = cleanList(ids).filter((id) => byId.has(id)).map((id) => byId.get(id));
  // Les projets absents de la liste reçue gardent leur place à la fin
  for (const p of list) if (!ordered.includes(p)) ordered.push(p);
  writeProjects(ordered);
  return ordered;
}

// ---------------------------------------------------------------------------
// Expériences professionnelles (src/data/experience.json)
// ---------------------------------------------------------------------------
export const EXPERIENCE_FILE = path.join(ROOT, "src", "data", "experience.json");

export function readExperience() {
  if (!fs.existsSync(EXPERIENCE_FILE)) return [];
  const raw = fs.readFileSync(EXPERIENCE_FILE, "utf8");
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("le fichier doit contenir une liste");
    return list;
  } catch (err) {
    throw new Error(`experience.json est invalide (${err.message}). Corrigez-le avant de continuer.`);
  }
}

function writeExperience(list) {
  fs.mkdirSync(path.dirname(EXPERIENCE_FILE), { recursive: true });
  fs.writeFileSync(EXPERIENCE_FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
}

/**
 * Crée ou met à jour une expérience.
 * input: { id?, company, role, date, text }
 */
export function upsertExperience(input) {
  const company = cleanText(input.company);
  if (!company) throw new Error("Le nom de l'entreprise est obligatoire.");

  const list = readExperience();
  const existing = input.id ? list.find((e) => e.id === input.id) : null;
  const role = cleanText(input.role);
  const id = existing ? existing.id : uniqueId(slugify(`${company} ${role}`), list);

  const item = { id, company, role, date: cleanText(input.date), text: cleanText(input.text) };

  if (existing) list[list.indexOf(existing)] = item;
  else list.unshift(item); // une nouvelle expérience apparaît en premier
  writeExperience(list);
  return item;
}

export function deleteExperience(id) {
  const list = readExperience();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) throw new Error("Expérience introuvable.");
  writeExperience(next);
  return next;
}

export function reorderExperience(ids) {
  const list = readExperience();
  const byId = new Map(list.map((e) => [e.id, e]));
  const ordered = cleanList(ids).filter((id) => byId.has(id)).map((id) => byId.get(id));
  for (const e of list) if (!ordered.includes(e)) ordered.push(e);
  writeExperience(ordered);
  return ordered;
}
