import { useEffect, useState } from "react";

// Effet « machine à écrire » qui alterne entre plusieurs mots.
export default function Typed({ words }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!words || words.length === 0) return;
    let w = 0;
    let c = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const word = words[w];
      setText(word.slice(0, c));
      if (!deleting && c < word.length) {
        c++;
        timer = setTimeout(tick, 110);
      } else if (!deleting) {
        deleting = true;
        timer = setTimeout(tick, 1500);
      } else if (c > 0) {
        c--;
        timer = setTimeout(tick, 55);
      } else {
        deleting = false;
        w = (w + 1) % words.length;
        timer = setTimeout(tick, 300);
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, [words]);

  return (
    <span className="typed-wrap">
      <span>{text}</span>
      <span className="cursor">|</span>
    </span>
  );
}
