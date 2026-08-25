import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/reveal";
import type { Faq } from "@/lib/types";

/**
 * FAQ accordion plus FAQPage structured data.
 *
 * The JSON-LD is not belt-and-braces: Radix unmounts collapsed accordion
 * content, so the answers are not all in the static HTML. The structured data
 * is what actually makes them legible to search, and it is what FAQ rich
 * results are read from either way.
 */
export function FaqSection({ faq }: { faq: Faq }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6"
    >
      <script
        type="application/ld+json"
        // Content is authored in this repo, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Reveal className="mb-10">
        <h2
          id="faq-heading"
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {faq.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {faq.intro}
        </p>
      </Reveal>

      <Reveal>
        <Accordion type="single" collapsible className="w-full">
          {faq.items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-border/60"
            >
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
