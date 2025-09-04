export function Card({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
export function CardContent({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
export function CardDescription({ children, ...props }) {
  return <p {...props}>{children}</p>;
}
export function CardHeader({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
export function CardTitle({ children, ...props }) {
  return <h2 {...props}>{children}</h2>;
}

