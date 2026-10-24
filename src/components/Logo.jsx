export default function Logo({ name }) {
  const [first, ...rest] = name.split(" ");
  return (
    <a href="#home" className="logo">
      {first}
      <span>.</span>
      {rest.join(" ")}
    </a>
  );
}
