import Reveal from "./Reveal.jsx";

export default function Services({ services }) {
  return (
    <section className="section" id="service">
      <div className="container">
        <div className="section__head">
          <Reveal as="p" className="eyebrow">
            Mes services
          </Reveal>
          <Reveal as="h2" className="section__title">
            Ce que je peux faire pour vous
          </Reveal>
        </div>

        <div className="services">
          {services.map((s) => (
            <Reveal as="article" className="card" key={s.title}>
              <div className="card__icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
