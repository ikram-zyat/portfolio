import { useState } from "react";
import Reveal from "./Reveal.jsx";

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Contact({ profile }) {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: "error" | "success", text }

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const found = {};
    if (!name) found.name = true;
    if (!emailOk(email)) found.email = true;
    if (message.length < 10) found.message = true;
    setErrors(found);

    if (Object.keys(found).length) {
      setStatus({ type: "error", text: "Merci de remplir correctement les champs en rouge." });
      form.elements[Object.keys(found)[0]].focus();
      return;
    }

    // Ouvre l'application mail du visiteur. Pour un envoi direct sans application mail,
    // utilisez un service comme Formspree ou EmailJS.
    const subject = encodeURIComponent(`Message de ${name} via le portfolio`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;

    setStatus({ type: "success", text: "Merci ! Votre application mail va s'ouvrir." });
    form.reset();
  };

  return (
    <section className="section" id="contact">
      <div className="container contact">
        <div className="contact__info">
          <Reveal as="p" className="eyebrow">
            Contact
          </Reveal>
          <Reveal as="h2" className="section__title">
            Un projet en tête ? Parlons-en.
          </Reveal>
          <Reveal as="p">Décrivez-moi votre besoin, je vous réponds rapidement.</Reveal>
          <Reveal as="ul" className="contact__list">
            <li>
              <small>E-mail</small>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              <small>Téléphone</small>
              <a href={`tel:${profile.phone}`}>{profile.phoneDisplay}</a>
            </li>
            <li>
              <small>Adresse</small>
              <span>{profile.location}</span>
            </li>
          </Reveal>
        </div>

        <Reveal as="form" className="form" noValidate onSubmit={onSubmit}>
          <div className={`field ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="name">Nom</label>
            <input type="text" id="name" name="name" placeholder="Votre nom" required />
          </div>
          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" placeholder="votre@email.com" required />
          </div>
          <div className={`field ${errors.message ? "has-error" : ""}`}>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="5" placeholder="Parlez-moi de votre projet…" required></textarea>
          </div>
          <button type="submit" className="btn">
            Envoyer le message
          </button>
          <p className={`form__status ${status ? (status.type === "error" ? "is-error" : "is-success") : ""}`} role="status" aria-live="polite">
            {status ? status.text : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
