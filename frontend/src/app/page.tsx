import { YouTubeCaptionExtractor } from '@/components/YouTubeCaptionExtractor';

const featureCards = [
  {
    title: 'Fast Caption Workflow',
    description:
      'Paste a video URL and let the backend process captions so your frontend stays lightweight.',
  },
  {
    title: 'API-First Architecture',
    description:
      'The page focuses on presentation while business logic and processing stay in backend services.',
  },
  {
    title: 'Production-Ready UI',
    description:
      'A clean landing experience with a simple call to action and instant result preview.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-screen-lg px-4 pb-12 pt-20 text-center sm:px-6">
        <p className="inline-flex rounded-full bg-secondary px-4 py-1 text-sm font-medium text-secondary-foreground">
          Get Out Video
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Extract and format YouTube captions in one place
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          This frontend is now a public landing experience only. Authentication,
          billing, database access, and other business workflows are handled in
          the backend.
        </p>
      </section>

      <section className="mx-auto grid max-w-screen-lg gap-4 px-4 pb-12 sm:grid-cols-3 sm:px-6">
        {featureCards.map(item => (
          <article key={item.title} className="rounded-xl border bg-card p-5 text-left">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-screen-lg px-4 pb-20 sm:px-6">
        <YouTubeCaptionExtractor />
      </section>
    </main>
  );
}
