// Commandes pour gérer les projets depuis le terminal :
//   npm run add-project      ajouter un projet (questions pas à pas)
//   npm run list-projects    voir la liste
//   npm run remove-project   supprimer un projet
//   npm run add-experience   ajouter une expérience professionnelle
//   npm run remove-experience   supprimer une expérience
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  readProjects, upsertProject, deleteProject,
  readExperience, upsertExperience, deleteExperience,
} from "./store.mjs";

const command = process.argv[2];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();

// Pose une question et renvoie la réponse (null si la saisie est terminée)
async function ask(question) {
  rl.setPrompt(question);
  rl.prompt();
  const r = await lines.next();
  return r.done ? null : String(r.value).trim();
}

async function required(question) {
  for (;;) {
    const value = await ask(question);
    if (value === null) throw new Error("Saisie interrompue.");
    if (value) return value;
    console.log("  Ce champ est obligatoire.");
  }
}

const optional = async (question) => (await ask(question)) ?? "";
const split = (text, sep) => text.split(sep).map((s) => s.trim()).filter(Boolean);
const unquote = (s) => s.replace(/^["']|["']$/g, "").trim();

async function add() {
  const projects = readProjects();
  const known = [...new Set(projects.map((p) => p.category).filter(Boolean))];

  console.log("\nNouveau projet (Entrée pour passer un champ facultatif)\n");
  const title = await required("Titre du projet : ");
  const category = await optional(`Catégorie${known.length ? ` (${known.join(", ")})` : ""} : `);
  const subtitle = await optional("Petite ligne sous le titre (ex. React.js · Laravel · MySQL) : ");
  const meta = await optional("Période et rôle (ex. Application · 2025 · Développeuse web) : ");
  const description = await optional("Description : ");
  const features = split(await optional("Fonctionnalités, séparées par des points-virgules : "), ";");
  const tech = split(await optional("Technologies, séparées par des virgules : "), ",");
  const photos = split(
    await optional("Photos : chemins des fichiers séparés par des virgules (vous pouvez glisser-déposer) : "),
    ","
  ).map(unquote);

  const newImages = [];
  for (const file of photos) {
    if (!fs.existsSync(file)) {
      console.log(`  ⚠ Fichier introuvable, ignoré : ${file}`);
      continue;
    }
    newImages.push({ name: path.basename(file), buffer: fs.readFileSync(file), ext: path.extname(file).slice(1) });
  }

  let project;
  try {
    project = upsertProject({ title, category, subtitle, meta, description, features, tech, images: [], newImages });
  } catch (err) {
    console.log(`\n✖ ${err.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n✔ Projet ajouté : ${project.title} (${project.images.length} photo(s))`);
  console.log("  Il apparaît en premier dans la liste. Lancez `npm run dev` pour le voir,");
  console.log("  puis `npm run publish` pour le mettre en ligne.\n");
}

function list() {
  const projects = readProjects();
  if (!projects.length) return console.log("Aucun projet pour l'instant.");
  projects.forEach((p, i) =>
    console.log(`${String(i + 1).padStart(2)}. ${p.title}  [${p.category}]  ${p.images.length} photo(s)  (id : ${p.id})`)
  );
}

async function remove() {
  const projects = readProjects();
  if (!projects.length) return console.log("Aucun projet à supprimer.");
  list();
  const answer = await required("\nNuméro du projet à supprimer : ");
  const project = projects[Number(answer) - 1];
  if (!project) {
    console.log("Numéro invalide.");
    process.exitCode = 1;
    return;
  }
  const sure = await optional(`Supprimer « ${project.title} » et ses photos ? (oui/non) : `);
  if (!/^(o|oui|y|yes)$/i.test(sure)) return console.log("Annulé.");
  deleteProject(project.id);
  console.log(`✔ Projet supprimé : ${project.title}`);
}

async function addExperience() {
  console.log("\nNouvelle expérience (Entrée pour passer un champ facultatif)\n");
  const company = await required("Entreprise : ");
  const role = await optional("Poste (ex. Développeuse web) : ");
  const date = await optional("Période (ex. Juill. 2026 — Présent) : ");
  const text = await optional("Description : ");
  try {
    const item = upsertExperience({ company, role, date, text });
    console.log(`\n✔ Expérience ajoutée : ${item.company}`);
    console.log("  Elle apparaît en premier dans la liste. Lancez `npm run dev` pour la voir,");
    console.log("  puis `npm run publish` pour la mettre en ligne.\n");
  } catch (err) {
    console.log(`\n✖ ${err.message}`);
    process.exitCode = 1;
  }
}

async function removeExperienceCmd() {
  const items = readExperience();
  if (!items.length) return console.log("Aucune expérience à supprimer.");
  items.forEach((e, i) => console.log(`${String(i + 1).padStart(2)}. ${e.company}  ${e.role}  ${e.date}`));
  const answer = await required("\nNuméro de l'expérience à supprimer : ");
  const item = items[Number(answer) - 1];
  if (!item) {
    console.log("Numéro invalide.");
    process.exitCode = 1;
    return;
  }
  const sure = await optional(`Supprimer « ${item.company} » ? (oui/non) : `);
  if (!/^(o|oui|y|yes)$/i.test(sure)) return console.log("Annulé.");
  deleteExperience(item.id);
  console.log(`✔ Expérience supprimée : ${item.company}`);
}

try {
  if (command === "add") await add();
  else if (command === "list") list();
  else if (command === "remove") await remove();
  else if (command === "add-experience") await addExperience();
  else if (command === "remove-experience") await removeExperienceCmd();
  else console.log("Commandes : add, list, remove, add-experience, remove-experience");
} catch (err) {
  console.log(`\n✖ ${err.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
