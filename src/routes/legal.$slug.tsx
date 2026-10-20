import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { legalPages, type LegalSlug } from "@/data/site";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => {
    const page = legalPages[params.slug as LegalSlug];
    return {
      meta: [
        { title: page ? `${page.title} | Fundación VNE` : "Documento | Fundación VNE" },
        { name: "description", content: page?.description ?? "Documento institucional de Fundación VNE." },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const page = legalPages[slug as LegalSlug];
  if (!page) throw notFound();

  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
        <p className="text-xs font-bold tracking-[0.18em] text-gold-deep uppercase">Gobernanza</p>
        <h1 className="mt-3 font-display text-4xl text-navy dark:text-cream">{page.title}</h1>
        <div className="mt-8 space-y-8">
          {page.blocks.map((block) => (
            <section key={block.heading ?? block.paragraphs[0]}>
              {block.heading ? <h2 className="font-display text-2xl text-navy dark:text-cream">{block.heading}</h2> : null}
              {block.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-relaxed text-mist dark:text-cream/80">
                  {paragraph}
                </p>
              ))}
              {block.list ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-mist dark:text-cream/80">
                  {block.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <Link to="/" className="mt-10 inline-flex text-sm font-bold text-navy underline-offset-4 hover:underline dark:text-gold">
          Volver al inicio
        </Link>
      </article>
    </Shell>
  );
}
