// Root layout required for Next.js App Router
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout only handles the root structure
  // The actual HTML structure is in [locale]/layout.tsx
  return children;
}
