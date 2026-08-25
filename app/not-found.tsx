import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-sm text-violet-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        No path here
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        That page does not exist. The six career paths are all linked from the
        homepage.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to the roadmap</Link>
      </Button>
    </div>
  );
}
