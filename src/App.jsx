import profile from "./data/profile.json";
import projects from "./data/projects.json";
import experience from "./data/experience.json";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Experience from "./components/Experience.jsx";
import Projects from "./components/Projects.jsx";
import Stats from "./components/Stats.jsx";
import Services from "./components/Services.jsx";
import Extra from "./components/Extra.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <>
      <Header name={profile.name} />
      <main>
        <Hero profile={profile} />
        <About profile={profile} />
        <Experience experience={experience} education={profile.education} />
        <Projects projects={projects} />
        <Stats profile={profile} projectCount={projects.length} experienceCount={experience.length} />
        <Services services={profile.services} />
        <Extra profile={profile} />
        <Contact profile={profile} />
      </main>
      <Footer name={profile.name} />
    </>
  );
}
