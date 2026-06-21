import { Diamond } from '@/components/art/Diamond';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <Diamond shape="pear" size={120} id="nf" className="animate-float" />
      <p className="mt-8 eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-5xl font-light md:text-6xl">A flawless page — that isn’t here</h1>
      <p className="mt-4 max-w-md font-light text-ink/60">
        The page you are looking for may have moved. Let us guide you back to the light.
      </p>
      <div className="mt-9 flex flex-col gap-4 sm:flex-row">
        <Button href="/" variant="primary" size="lg">Return Home</Button>
        <Button href="/engagement-rings" variant="outline" size="lg">Explore Jewellery</Button>
      </div>
    </div>
  );
}
