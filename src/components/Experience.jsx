import Reveal from "./Reveal.jsx";

const num = (i) => String(i + 1).padStart(2, "0");

export default function Experience({ experience, education }) {
  return (
    <section className="section section--alt" id="experience">
      <div className="container">
        <div className="section__head">
          <Reveal as="p" className="eyebrow">
            Mon parcours
          </Reveal>
          <Reveal as="h2" className="section__title">
            Expériences professionnelles
          </Reveal>
        </div>

        <ul className="timeline">
          {experience.map((item, i) => (
            <Reveal as="li" className="timeline__item" key={item.id}>
              <span className="timeline__num">{num(i)}</span>
              <div>
                <h3>{item.company}</h3>
                <p className="timeline__role">{item.role}</p>
              </div>
              <span className="timeline__date">{item.date}</span>
              <p className="timeline__text">{item.text}</p>
            </Reveal>
          ))}
        </ul>

        <div className="section__head section__head--sub">
          <Reveal as="h2" className="section__title">
            Formation
          </Reveal>
        </div>

        <ul className="timeline">
          {education.map((item, i) => (
            <Reveal as="li" className="timeline__item" key={`${item.title}-${item.date}`}>
              <span className="timeline__num">{num(i)}</span>
              <div>
                <h3>{item.title}</h3>
                <p className="timeline__role">{item.place}</p>
              </div>
              <span className="timeline__date">{item.date}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
