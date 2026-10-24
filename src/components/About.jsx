import Reveal from "./Reveal.jsx";
import Counter from "./Counter.jsx";

export default function About({ profile }) {
  return (
    <section className="section" id="about">
      <div className="container about">
        <Reveal className="about__media">
          <div className="photo">
            <img src={profile.photo} alt={`Portrait de ${profile.name}`} />
          </div>
          <div className="about__badge">
            <Counter to={profile.yearsExperience} suffix="+" />
            <span>ans d'expériences en développement</span>
          </div>
        </Reveal>

        <div className="about__content">
          <Reveal as="p" className="eyebrow">
            À propos de moi
          </Reveal>
          <Reveal as="h2" className="section__title">
            {profile.aboutTitle}
          </Reveal>
          {profile.about.map((text, i) => (
            <Reveal as="p" key={i}>
              {text}
            </Reveal>
          ))}

          <Reveal as="ul" className="chips" aria-label="Compétences">
            {profile.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </Reveal>

          <Reveal as="a" href="#contact" className="btn">
            Travaillons ensemble
          </Reveal>
        </div>
      </div>
    </section>
  );
}
