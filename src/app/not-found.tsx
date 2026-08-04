import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";

export default function NotFound() {
  const dictionary = getDictionary("en");

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-10 text-center">
          <p className="text-6xl font-black text-primary">404</p>
          <h1 className="mt-4 text-xl font-bold">{dictionary.notFound.title}</h1>
          <Button asChild className="mt-6">
            <Link href="/dashboard">{dictionary.notFound.returnDashboard}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
