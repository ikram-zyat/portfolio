export const TONES = ["g1", "g2", "g3", "g4", "g5", "g6"];

// Couleur de remplacement (dégradé) pour un projet sans photo.
// Si le projet n'a pas de "color", on en déduit une, toujours la même, à partir de son id.
export function toneFor(project) {
  if (project.color) return project.color;
  let h = 0;
  for (const ch of project.id || project.title || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}
// Ajoute le préfixe du site ("/portfolio/") aux chemins du dossier public
export function asset(path) {
  if (!path || /^(https?:|data:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}