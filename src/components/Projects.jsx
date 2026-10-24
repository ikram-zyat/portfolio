import { useMemo, useState } from "react";
import Reveal from "./Reveal.jsx";
import ProjectModal from "./ProjectModal.jsx";
import { toneFor, asset } from "../utils.js";
const ALL = "Tous";

export default function Projects({ projects }) {
  const [filter, setFilter] = useState(ALL);
  const [selected, setSelected] = useState(null);

  // Les boutons de filtre sont créés à partir des catégories des projets
  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category).filter(Boolean))],
    [projects]
  );
  const active = categories.includes(filter) ? filter : ALL;
  const shown = projects.filter((p) => active === ALL || p.category === active);

  return (
    <section className="section" id="portfolio">
      <div className="container">
        <div className="section__head">
          <Reveal as="p" className="eyebrow">
            Portfolio
          </Reveal>
          <Reveal as="h2" className="section__title">
            Mes projets
          </Reveal>
        </div>

        {categories.length > 1 && (
          <Reveal className="filters" role="tablist" aria-label="Filtrer les projets">
            {[ALL, ...categories].map((cat) => (
              <button
                type="button"
                key={cat}
                className={`filter ${active === cat ? "is-active" : ""}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </Reveal>
        )}

        <div className="projects">
          {shown.map((p) => {
            const cover = p.images && p.images[0] ? asset(p.images[0]) : null;
            const subtitle = p.subtitle || (p.tech && p.tech.length ? p.tech.join(" · ") : p.category);
            return (
              <Reveal as="article" className="project" key={p.id}>
                <button
                  type="button"
                  className={`project__thumb ${cover ? "" : toneFor(p)}`}
                  style={
                    cover
                      ? { backgroundImage: `url("${cover}")`, backgroundSize: "cover", backgroundPosition: "top center" }
                      : undefined
                  }
                  aria-label={`Voir le projet ${p.title}`}
                  onClick={() => setSelected(p)}
                >
                  <span>Voir le projet</span>
                </button>
                <div className="project__info" onClick={() => setSelected(p)}>
                  <h3>{p.title}</h3>
                  <p>{subtitle}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {projects.length === 0 && <p className="projects__empty">Les projets arrivent bientôt.</p>}
      </div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
