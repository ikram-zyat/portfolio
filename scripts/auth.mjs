// Accès à l'espace admin : e-mail + mot de passe, stockés dans .admin-auth.json
// (fichier local, jamais publié : il est dans .gitignore).
// Le mot de passe n'est jamais enregistré en clair : seulement son empreinte (scrypt + sel).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUTH_FILE = path.join(ROOT, ".admin-auth.json");

// Adresses qu'on ne peut pas choisir (déjà utilisées par le site ou par Vite)
const RESERVED = new Set([
  "admin", "administrator", "login", "logout", "src", "public", "assets", "scripts",
  "node_modules", "images", "index", "api", "dist", "vite", "favicon",
]);

export function readAuth() {
  try {
    const a = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
    return a && a.email && a.salt && a.hash && a.path ? a : null;
  } catch {
    return null;
  }
}

const derive = (password, saltHex) => crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), 64);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuth({ email, password, slug }) {
  const mail = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) throw new Error("Adresse e-mail invalide.");

  const pwd = String(password || "");
  if (pwd.length < 10) throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  if (pwd.length > 200) throw new Error("Le mot de passe est trop long (200 caractères maximum).");
  if (pwd.toLowerCase() === mail) throw new Error("Le mot de passe ne doit pas être votre adresse e-mail.");

  const s = String(slug || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{3,40}$/.test(s)) {
    throw new Error("L'adresse doit faire 4 à 41 caractères : lettres minuscules, chiffres et tirets.");
  }
  if (RESERVED.has(s) || [ROOT, path.join(ROOT, "public")].some((dir) => fs.existsSync(path.join(dir, s)) || fs.existsSync(path.join(dir, `${s}.html`)))) {
    throw new Error("Cette adresse est déjà utilisée, choisissez-en une autre.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const data = { email: mail, salt, hash: derive(pwd, salt).toString("hex"), path: `/${s}` };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  return data;
}

// Vérifie l'e-mail et le mot de passe. Le calcul de l'empreinte est toujours fait,
// même si l'e-mail est faux, pour que le temps de réponse ne révèle rien.
export function checkPassword(auth, email, password) {
  const given = derive(String(password || "").slice(0, 200), auth.salt);
  const expected = Buffer.from(auth.hash, "hex");
  const passwordOk = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  const emailOk = String(email || "").trim().toLowerCase() === auth.email;
  return passwordOk && emailOk;
}
