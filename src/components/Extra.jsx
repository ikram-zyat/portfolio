import Reveal from "./Reveal.jsx";

export default function Extra({ profile }) {
  const columns = [
    ["Certifications", profile.certifications],
    ["Langues", profile.languages],
    ["Centres d'intérêt", profile.interests],
  ];

  return (
    <section className="section section--alt" id="extra">
      <div className="container extra">
        {columns.map(([title, items]) => (
          <Reveal className="extra__col" key={title}>
            <h3>{title}</h3>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
