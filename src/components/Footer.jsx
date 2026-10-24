import Logo from "./Logo.jsx";

export default function Footer({ name }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Logo name={name} />
        <p>
          © {new Date().getFullYear()} {name}. Tous droits réservés.
        </p>
        <a href="#home" className="link">
          Retour en haut ↑
        </a>
      </div>
    </footer>
  );
}
