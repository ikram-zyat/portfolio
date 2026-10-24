import { useEffect, useMemo, useState } from "react";

// Espace admin local : se connecter, puis gérer les projets et les expériences du portfolio.
// Disponible uniquement avec `npm run admin` (jamais publié avec le site).

async function api(path, options = {}) {
  const res = await fetch(`/__admin${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Erreur du serveur");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Réduit les photos (largeur max 1600 px, JPEG) pour garder le site léger
async function fileToDataUrl(file, maxWidth = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/* ------------------------------------------------------------------ */
/* Écran principal : connexion ou tableau de bord                      */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const [auth, setAuth] = useState("loading"); // loading | setup | login | in
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    api("/state")
      .then((s) => setAuth(!s.configured ? "setup" : s.loggedIn ? "in" : "login"))
      .catch((err) => setProblem(err.message));
  }, []);

  if (problem) {
    return (
      <div className="admin admin--narrow">
        <p className="admin__notice is-error">{problem}</p>
      </div>
    );
  }
  if (auth === "loading") {
    return (
      <div className="admin admin--narrow">
        <p className="admin__muted">Chargement…</p>
      </div>
    );
  }
  if (auth === "setup" || auth === "login") {
    return <Gate mode={auth} onDone={() => setAuth("in")} />;
  }
  return <Dashboard onLogout={() => setAuth("login")} />;
}

/* ------------------------------------------------------------------ */
/* Création de l'accès (première fois) et connexion                    */
/* ------------------------------------------------------------------ */

function Gate({ mode, onDone }) {
  const isSetup = mode === "setup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [slug, setSlug] = useState(() => `gestion-${Math.random().toString(36).slice(2, 8)}`);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (isSetup && password !== confirm) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setBusy(true);
    try {
      if (isSetup) {
        const { path } = await api("/setup", { method: "POST", body: JSON.stringify({ email, password, slug }) });
        window.history.replaceState(null, "", path);
        setCreated(path);
      } else {
        await api("/login", { method: "POST", body: JSON.stringify({ email, password }) });
        onDone();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="admin admin--narrow">
        <div className="admin__form">
          <h2>Accès créé</h2>
          <p className="admin__muted">Votre espace admin est maintenant à cette adresse secrète :</p>
          <p className="admin__url">{`${window.location.origin}${created}`}</p>
          <p className="admin__muted">
            Notez-la bien : l'ancienne adresse <code>/admin.html</code> ne fonctionne plus. Pour y revenir, lancez
            simplement <code>npm run admin</code>.
          </p>
          <div className="admin__buttons">
            <button type="button" className="btn" onClick={onDone}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin admin--narrow">
      <header className="admin__top">
        <div>
          <h1>{isSetup ? "Créer votre accès" : "Connexion"}</h1>
          <p>
            {isSetup
              ? "Première fois : choisissez l'e-mail et le mot de passe de votre espace admin."
              : "Espace admin du portfolio."}
          </p>
        </div>
      </header>

      <form className="admin__form" onSubmit={submit}>
        {error && <p className="admin__notice is-error">{error}</p>}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSetup ? "new-password" : "current-password"}
            minLength={isSetup ? 10 : undefined}
            required
          />
          {isSetup && <small className="admin__hint">10 caractères minimum.</small>}
        </label>

        {isSetup && (
          <>
            <label>
              Confirmer le mot de passe
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Adresse secrète de l'espace admin
              <span className="admin__slug">
                <span>{`${window.location.origin}/`}</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                />
              </span>
              <small className="admin__hint">Remplace /admin.html. Choisissez quelque chose de difficile à deviner.</small>
            </label>
          </>
        )}

        <div className="admin__buttons">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Un instant…" : isSetup ? "Créer mon accès" : "Se connecter"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tableau de bord : onglets Projets et Expériences                    */
/* ------------------------------------------------------------------ */

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("projects");
  const [notice, setNotice] = useState(null);

  // Une erreur 401 veut dire que la connexion a expiré : retour à l'écran de connexion
  const onError = (err) => {
    if (err.status === 401) onLogout();
    else setNotice({ type: "error", text: err.message });
  };

  const logout = async () => {
    try {
      await api("/logout", { method: "POST", body: "{}" });
    } finally {
      onLogout();
    }
  };

  const switchTab = (next) => {
    setNotice(null);
    setTab(next);
  };

  return (
    <div className="admin">
      <header className="admin__top">
        <div>
          <h1>Espace admin</h1>
          <p>Gérez le contenu de votre portfolio, sans toucher au code.</p>
        </div>
        <div className="admin__top-actions">
          <a className="btn btn--ghost btn--small" href="/" target="_blank" rel="noreferrer">
            Voir le site ↗
          </a>
          <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </header>

      <nav className="admin__tabs" aria-label="Sections">
        <button type="button" className={tab === "projects" ? "is-active" : ""} onClick={() => switchTab("projects")}>
          Projets
        </button>
        <button type="button" className={tab === "experience" ? "is-active" : ""} onClick={() => switchTab("experience")}>
          Expériences professionnelles
        </button>
      </nav>

      {notice && <p className={`admin__notice is-${notice.type}`}>{notice.text}</p>}

      {tab === "projects" ? (
        <ProjectsPanel setNotice={setNotice} onError={onError} />
      ) : (
        <ExperiencePanel setNotice={setNotice} onError={onError} />
      )}

      <aside className="admin__help">
        <h2>Mettre en ligne</h2>
        <p>
          Vos changements sont enregistrés sur votre ordinateur. Pour les publier, lancez
          <code>npm run publish</code> dans le terminal : votre hébergeur (Vercel, Netlify…) met le site à jour.
        </p>
        <p>Cet espace n'existe que sur votre ordinateur : il n'est jamais publié avec le site.</p>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Projets                                                             */
/* ------------------------------------------------------------------ */

const emptyProject = {
  id: null,
  title: "",
  category: "",
  subtitle: "",
  meta: "",
  description: "",
  features: "",
  tech: "",
  images: [],
  newImages: [],
};

const projectToForm = (p) => ({
  id: p.id,
  title: p.title || "",
  category: p.category || "",
  subtitle: p.subtitle || "",
  meta: p.meta || "",
  description: p.description || "",
  features: (p.features || []).join("\n"),
  tech: (p.tech || []).join(", "),
  images: p.images || [],
  newImages: [],
});

function ProjectsPanel({ setNotice, onError }) {
  const [projects, setProjects] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/projects").then(setProjects).catch(onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () => [...new Set((projects || []).map((p) => p.category).filter(Boolean))],
    [projects]
  );

  const move = async (index, delta) => {
    const ids = projects.map((p) => p.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      setProjects(await api("/order", { method: "POST", body: JSON.stringify({ ids }) }));
    } catch (err) {
      onError(err);
    }
  };

  const remove = async (project) => {
    if (!window.confirm(`Supprimer « ${project.title} » et ses photos ?`)) return;
    try {
      setProjects(await api(`/projects/${project.id}`, { method: "DELETE" }));
      setNotice({ type: "ok", text: "Projet supprimé." });
    } catch (err) {
      onError(err);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        id: form.id,
        title: form.title,
        category: form.category,
        subtitle: form.subtitle,
        meta: form.meta,
        description: form.description,
        features: form.features.split("\n"),
        tech: form.tech.split(","),
        images: form.images,
        newImages: form.newImages,
      };
      await api("/projects", { method: "POST", body: JSON.stringify(payload) });
      setProjects(await api("/projects"));
      setForm(null);
      setNotice({ type: "ok", text: "Projet enregistré. Le site se met à jour tout seul dans l'autre onglet." });
      window.scrollTo(0, 0);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  if (form) {
    return (
      <ProjectForm
        form={form}
        setForm={setForm}
        categories={categories}
        busy={busy}
        onSubmit={save}
        onCancel={() => setForm(null)}
      />
    );
  }

  return (
    <>
      <div className="admin__bar">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setNotice(null);
            setForm({ ...emptyProject });
          }}
        >
          + Nouveau projet
        </button>
      </div>

      {projects === null && <p className="admin__muted">Chargement…</p>}
      {projects && projects.length === 0 && <p className="admin__muted">Aucun projet. Ajoutez le premier !</p>}

      <ul className="admin__list">
        {(projects || []).map((p, i) => (
          <li key={p.id} className="admin__row">
            <div
              className={`admin__thumb ${p.images[0] ? "" : p.color || "g1"}`}
              style={p.images[0] ? { backgroundImage: `url("${p.images[0]}")` } : undefined}
            />
            <div className="admin__info">
              <strong>{p.title}</strong>
              <span>
                {p.category} · {p.images.length} photo{p.images.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="admin__actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === projects.length - 1} aria-label="Descendre">↓</button>
              <button type="button" onClick={() => { setNotice(null); setForm(projectToForm(p)); }}>Modifier</button>
              <button type="button" className="is-danger" onClick={() => remove(p)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ProjectForm({ form, setForm, categories, busy, onSubmit, onCancel }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    const added = [];
    for (const file of files) {
      try {
        added.push({ name: file.name, dataUrl: await fileToDataUrl(file) });
      } catch {
        /* image illisible : on l'ignore */
      }
    }
    setForm((f) => ({ ...f, newImages: [...f.newImages, ...added] }));
  };

  const removeSaved = (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  const removeNew = (i) => setForm((f) => ({ ...f, newImages: f.newImages.filter((_, n) => n !== i) }));
  const makeCover = (url) => setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));

  return (
    <form className="admin__form" onSubmit={onSubmit}>
      <h2>{form.id ? "Modifier le projet" : "Nouveau projet"}</h2>

      <label>
        Titre *
        <input value={form.title} onChange={set("title")} placeholder="Ex. MbLifeStyle, boutique e-commerce" required />
      </label>

      <div className="admin__two">
        <label>
          Catégorie
          <input value={form.category} onChange={set("category")} list="categories" placeholder="Applications, Sites web…" />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Ligne sous le titre (sur la carte)
          <input value={form.subtitle} onChange={set("subtitle")} placeholder="React.js · Laravel · MySQL" />
        </label>
      </div>

      <label>
        Période et rôle
        <input value={form.meta} onChange={set("meta")} placeholder="Application · 2026 · Développeuse web" />
      </label>

      <label>
        Description
        <textarea rows="3" value={form.description} onChange={set("description")} placeholder="De quoi s'agit-il ?" />
      </label>

      <label>
        Fonctionnalités (une par ligne)
        <textarea rows="5" value={form.features} onChange={set("features")} placeholder={"Gestion des produits\nPanier et commandes"} />
      </label>

      <label>
        Technologies (séparées par des virgules)
        <input value={form.tech} onChange={set("tech")} placeholder="React.js, Laravel, MySQL" />
      </label>

      <div className="admin__photos">
        <span className="admin__label">Photos (facultatif, la première sert d'aperçu)</span>
        <div className="admin__grid">
          {form.images.map((url, i) => (
            <figure key={url} className="admin__photo">
              <img src={url} alt="" />
              {i === 0 ? (
                <span className="admin__badge">Aperçu</span>
              ) : (
                <button type="button" className="admin__cover" onClick={() => makeCover(url)}>Mettre en aperçu</button>
              )}
              <button type="button" className="admin__x" onClick={() => removeSaved(url)} aria-label="Retirer la photo">×</button>
            </figure>
          ))}
          {form.newImages.map((img, i) => (
            <figure key={`new${i}`} className="admin__photo is-new">
              <img src={img.dataUrl} alt="" />
              <span className="admin__badge">Nouvelle</span>
              <button type="button" className="admin__x" onClick={() => removeNew(i)} aria-label="Retirer la photo">×</button>
            </figure>
          ))}
          <label
            className="admin__drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            + Ajouter des photos
            <small>ou glissez-les ici</small>
          </label>
        </div>
      </div>

      <div className="admin__buttons">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Expériences professionnelles                                        */
/* ------------------------------------------------------------------ */

const emptyExperience = { id: null, company: "", role: "", date: "", text: "" };

function ExperiencePanel({ setNotice, onError }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/experience").then(setItems).catch(onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = async (index, delta) => {
    const ids = items.map((e) => e.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      setItems(await api("/experience-order", { method: "POST", body: JSON.stringify({ ids }) }));
    } catch (err) {
      onError(err);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Supprimer l'expérience « ${item.company} » ?`)) return;
    try {
      setItems(await api(`/experience/${item.id}`, { method: "DELETE" }));
      setNotice({ type: "ok", text: "Expérience supprimée." });
    } catch (err) {
      onError(err);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await api("/experience", { method: "POST", body: JSON.stringify(form) });
      setItems(await api("/experience"));
      setForm(null);
      setNotice({ type: "ok", text: "Expérience enregistrée. Le site se met à jour tout seul dans l'autre onglet." });
      window.scrollTo(0, 0);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (form) {
    return (
      <form className="admin__form" onSubmit={save}>
        <h2>{form.id ? "Modifier l'expérience" : "Nouvelle expérience"}</h2>

        <label>
          Entreprise *
          <input value={form.company} onChange={set("company")} placeholder="Ex. MbLifeStyle" required />
        </label>

        <div className="admin__two">
          <label>
            Poste
            <input value={form.role} onChange={set("role")} placeholder="Développeuse web" />
          </label>
          <label>
            Période
            <input value={form.date} onChange={set("date")} placeholder="Juill. 2026 — Présent" />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows="5"
            value={form.text}
            onChange={set("text")}
            placeholder="Ce que vous avez réalisé : missions, technologies utilisées…"
          />
        </label>

        <div className="admin__buttons">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setForm(null)} disabled={busy}>
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="admin__bar">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setNotice(null);
            setForm({ ...emptyExperience });
          }}
        >
          + Nouvelle expérience
        </button>
      </div>

      {items === null && <p className="admin__muted">Chargement…</p>}
      {items && items.length === 0 && <p className="admin__muted">Aucune expérience. Ajoutez la première !</p>}

      <ul className="admin__list">
        {(items || []).map((item, i) => (
          <li key={item.id} className="admin__row admin__row--text">
            <div className="admin__info">
              <strong>{item.company}</strong>
              <span>{[item.role, item.date].filter(Boolean).join(" · ")}</span>
            </div>
            <div className="admin__actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre">↓</button>
              <button type="button" onClick={() => { setNotice(null); setForm({ ...item }); }}>Modifier</button>
              <button type="button" className="is-danger" onClick={() => remove(item)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
