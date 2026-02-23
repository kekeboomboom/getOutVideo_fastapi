import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-3 text-muted-foreground">The page you are looking for does not exist.</p>
      <Link className="mt-6 font-medium text-blue-600 underline underline-offset-4" href="/">
        Back to home
      </Link>
    </main>
  );
}
