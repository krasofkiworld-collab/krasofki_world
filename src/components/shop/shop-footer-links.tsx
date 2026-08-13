import Link from "next/link";

const LINKS = [
  { href: "/about", label: "Про нас" },
  { href: "/faq", label: "Питання" },
  { href: "/terms", label: "Умови" },
  { href: "/privacy", label: "Конфіденційність" },
];

export function ShopFooterLinks() {
  return (
    <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 py-4 text-xs text-muted-foreground">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-foreground hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
