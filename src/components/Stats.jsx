import Reveal from "./Reveal.jsx";
import Counter from "./Counter.jsx";

const plural = (n, one, many) => (n > 1 ? many : one);

// Les chiffres se calculent tout seuls à partir des données :
// ajouter un projet ou une expérience met à jour les compteurs.
export default function Stats({ profile, projectCount, experienceCount }) {
  const certifications = profile.certifications.length;
  const stats = [
    { n: experienceCount, label: plural(experienceCount, "Expérience ou stage", "Expériences et stages") },
    { n: profile.skills.length, label: "Technologies maîtrisées" },
    { n: projectCount, label: plural(projectCount, "Projet présenté", "Projets présentés") },
    { n: certifications, label: plural(certifications, "Certification", "Certifications") },
  ];

  return (
    <section className="stats">
      <div className="container stats__grid">
        {stats.map((s) => (
          <Reveal className="stat" key={s.label}>
            <Counter to={s.n} />
            <span>{s.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
