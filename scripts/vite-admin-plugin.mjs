// API et protection de l'espace admin. Elle n'existe QUE pendant `npm run dev` / `npm run admin`
// (apply: "serve") : elle n'est jamais incluse dans le site publié par `npm run build`.
import crypto from "node:crypto";
import {
  readProjects, upsertProject, deleteProject, reorderProjects,
  readExperience, upsertExperience, deleteExperience, reorderExperience,
} from "./store.mjs";
import { readAuth, createAuth, checkPassword } from "./auth.mjs";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const SESSION_MS = 8 * 60 * 60 * 1000; // une connexion dure 8 heures
const MAX_FAILURES = 5; // après 5 erreurs de mot de passe, blocage temporaire
const LOCK_MS = 15 * 60 * 1000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(new Error("Requête invalide."));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default function adminApi() {
  // Connexions ouvertes (en mémoire : elles disparaissent quand on arrête le serveur)
  const sessions = new Map();
  let failures = 0;
  let lockedUntil = 0;

  const COOKIE = "admin_session";
  const cookieToken = (req) => {
    const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`).exec(req.headers.cookie || "");
    return m ? m[1] : null;
  };
  const isLoggedIn = (req) => {
    const token = cookieToken(req);
    if (!token) return false;
    const expires = sessions.get(token);
    if (!expires || expires < Date.now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  };
  const startSession = (res) => {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + SESSION_MS);
    res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
  };
  const endSession = (req, res) => {
    const token = cookieToken(req);
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  };

  return {
    name: "portfolio-admin-api",
    apply: "serve",
    configureServer(server) {
      // 1. Adresse personnalisée : une fois l'accès créé, la page admin n'est plus à /admin.html
      server.middlewares.use((req, res, next) => {
        const auth = readAuth();
        if (auth) {
          const pathname = String(req.url || "").split("?")[0];
          if (pathname === auth.path || pathname === `${auth.path}/`) {
            req.url = "/admin.html";
          } else if (pathname === "/admin.html" || pathname === "/admin") {
            res.statusCode = 404;
            return res.end("Not found");
          }
        }
        next();
      });

      // 2. API de l'espace admin
      server.middlewares.use("/__admin", async (req, res) => {
        try {
          // Uniquement depuis cet ordinateur
          const host = String(req.headers.host || "").replace(/:\d+$/, "");
          if (!LOCAL_HOSTS.has(host)) return send(res, 403, { error: "Accessible uniquement en local." });

          // Protection contre les requêtes envoyées par d'autres sites web
          const origin = req.headers.origin;
          if (origin && new URL(origin).host !== req.headers.host) {
            return send(res, 403, { error: "Origine refusée." });
          }
          if (req.method !== "GET" && !/application\/json/i.test(req.headers["content-type"] || "")) {
            return send(res, 415, { error: "JSON attendu." });
          }

          const url = new URL(req.url, "http://localhost");
          const route = url.pathname.replace(/\/+$/, "");

          // ----- Routes sans connexion : état, création de l'accès, connexion -----
          if (req.method === "GET" && route === "/state") {
            return send(res, 200, { configured: Boolean(readAuth()), loggedIn: isLoggedIn(req) });
          }

          if (req.method === "POST" && route === "/setup") {
            if (readAuth()) return send(res, 403, { error: "Un accès existe déjà." });
            const { email, password, slug } = await readBody(req);
            const auth = createAuth({ email, password, slug });
            startSession(res);
            return send(res, 200, { path: auth.path });
          }

          if (req.method === "POST" && route === "/login") {
            const auth = readAuth();
            if (!auth) return send(res, 403, { error: "Aucun accès n'a encore été créé." });
            if (Date.now() < lockedUntil) {
              const minutes = Math.ceil((lockedUntil - Date.now()) / 60000);
              return send(res, 429, { error: `Trop d'essais. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` });
            }
            const { email, password } = await readBody(req);
            if (!checkPassword(auth, email, password)) {
              failures += 1;
              if (failures >= MAX_FAILURES) {
                failures = 0;
                lockedUntil = Date.now() + LOCK_MS;
              }
              return send(res, 401, { error: "E-mail ou mot de passe incorrect." });
            }
            failures = 0;
            startSession(res);
            return send(res, 200, { ok: true });
          }

          if (req.method === "POST" && route === "/logout") {
            endSession(req, res);
            return send(res, 200, { ok: true });
          }

          // ----- Tout le reste exige d'être connecté -----
          if (!isLoggedIn(req)) return send(res, 401, { error: "Connexion requise." });

          if (req.method === "GET" && route === "/projects") return send(res, 200, readProjects());
          if (req.method === "POST" && route === "/projects") return send(res, 200, upsertProject(await readBody(req)));
          if (req.method === "POST" && route === "/order") {
            const { ids } = await readBody(req);
            return send(res, 200, reorderProjects(ids));
          }
          const delProject = /^\/projects\/([a-z0-9-]+)$/.exec(route);
          if (req.method === "DELETE" && delProject) return send(res, 200, deleteProject(delProject[1]));

          if (req.method === "GET" && route === "/experience") return send(res, 200, readExperience());
          if (req.method === "POST" && route === "/experience") return send(res, 200, upsertExperience(await readBody(req)));
          if (req.method === "POST" && route === "/experience-order") {
            const { ids } = await readBody(req);
            return send(res, 200, reorderExperience(ids));
          }
          const delExp = /^\/experience\/([a-z0-9-]+)$/.exec(route);
          if (req.method === "DELETE" && delExp) return send(res, 200, deleteExperience(delExp[1]));

          return send(res, 404, { error: "Route inconnue." });
        } catch (err) {
          return send(res, 400, { error: err.message || "Erreur" });
        }
      });
    },
  };
}
