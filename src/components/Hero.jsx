import { Fragment } from "react";
import Reveal from "./Reveal.jsx";
import Typed from "./Typed.jsx";

export default function Hero({ profile }) {
  // Deux moitiés identiques : l'animation défile de 50 % puis recommence sans saut visible
  const words = [...profile.marquee, ...profile.marquee];
  const half = words.map((word, i) => (
    <Fragment key={i}>
      <span>{word}</span>
      <span>•</span>
    </Fragment>
  ));

  return (
    <section className="hero" id="home">
      <div className="hero__glow" aria-hidden="true"></div>
      <div className="container hero__inner">
        <Reveal as="p" className="eyebrow">
          Bonjour, je suis <strong>{profile.name}</strong>
        </Reveal>

        <Reveal as="h1" className="hero__title">
          {profile.heroLine1}
          <br />
          {profile.heroLine2} <Typed words={profile.typedWords} />
        </Reveal>

        <Reveal as="p" className="hero__text">
          {profile.heroText}
        </Reveal>

        <Reveal className="hero__actions">
          <a href="#portfolio" className="btn">
            Voir mes projets
          </a>
          <a href={profile.cv} className="btn btn--ghost" download>
            Télécharger mon CV
          </a>
        </Reveal>

        <Reveal as="ul" className="hero__contact">
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <a href={`tel:${profile.phone}`}>{profile.phoneDisplay}</a>
          </li>
          <li>
            <span>{profile.location}</span>
          </li>
        </Reveal>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {half}
          {half}
        </div>
      </div>
    </section>
  );
}
