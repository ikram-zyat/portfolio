import { useEffect, useRef, useState } from "react";
import { toneFor } from "../utils.js";

// Fenêtre de détail d'un projet : galerie de photos, description, fonctionnalités, technologies.
export default function ProjectModal({ project, onClose }) {
  if (!project) return null;
  // "key" remet la fenêtre à zéro (première photo) quand on change de projet
  return <ModalContent key={project.id} project={project} onClose={onClose} />;
}

function ModalContent({ project, onClose }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const images = project.images || [];
  const features = project.features || [];
  const tech = project.tech || [];

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => ref.current && ref.current.close();
  const go = (i) => images.length && setIndex((i + images.length) % images.length);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modalTitle"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && close()}
      onKeyDown={onKeyDown}
    >
      <div className="modal__box">
        <button type="button" className="modal__close" onClick={close} aria-label="Fermer">
          ×
        </button>

        <div className="modal__gallery">
          <div className={`modal__main ${images.length ? "" : toneFor(project)}`}>
            {images.length > 0 ? (
              <img src={images[index]} alt={`Capture d'écran du projet ${project.title}`} />
            ) : (
              <p className="modal__empty">{project.title}</p>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="modal__nav modal__nav--prev"
                  aria-label="Photo précédente"
                  onClick={() => go(index - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="modal__nav modal__nav--next"
                  aria-label="Photo suivante"
                  onClick={() => go(index + 1)}
                >
                  →
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="modal__thumbs">
              {images.map((src, n) => (
                <button
                  type="button"
                  key={src}
                  className={n === index ? "is-active" : ""}
                  aria-label={`Photo ${n + 1}`}
                  onClick={() => setIndex(n)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal__body">
          {project.meta && <p className="modal__meta">{project.meta}</p>}
          <h3 id="modalTitle">{project.title}</h3>
          {project.description && <p className="modal__desc">{project.description}</p>}

          {features.length > 0 && (
            <>
              <h4>Fonctionnalités</h4>
              <ul className="modal__list">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}

          {tech.length > 0 && (
            <>
              <h4>Technologies</h4>
              <ul className="chips">
                {tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
