import Link from 'next/link';
import { Card, CardContent } from '@repo/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-10 text-content-primary">
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold tracking-tight">web</h1>
            <p className="text-sm text-content-secondary">
              Domain routes mirror api / contracts.
            </p>
            <Link
              href="/system"
              className="inline-flex text-sm font-medium text-brand-400 underline-offset-4 hover:underline"
            >
              Open /system
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
