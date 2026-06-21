import Link from 'next/link';

interface JewelTileProps {
  eyebrow?: string;
  title: string;
  href: string;
  /** Optional looping video of the piece (drop into /public/videos). */
  videoSrc?: string;
  /** Optional still image shown when there is no video. */
  poster?: string;
  /** Cinematic backdrop used until real media lands. */
  gradient: string;
  className?: string;
  large?: boolean;
}

/** A single window in the home mosaic — a video of one jewellery category. */
export function JewelTile({
  eyebrow,
  title,
  href,
  videoSrc,
  poster,
  gradient,
  className = '',
  large = false,
}: JewelTileProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-luxe group-hover:scale-105"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-[1.2s] ease-luxe group-hover:scale-105"
        />
      ) : null}

      {/* Veil for legibility */}
      <div className="absolute inset-0 bg-black/30 transition-colors duration-500 group-hover:bg-black/45" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        {eyebrow && (
          <span className="text-[10px] uppercase tracking-luxe text-white/70">
            {eyebrow}
          </span>
        )}
        <h2
          className={`mt-2 font-display font-light leading-tight ${
            large ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'
          }`}
        >
          {title}
        </h2>
        <span className="mt-3 text-[10px] uppercase tracking-luxe text-white/0 transition-colors duration-500 group-hover:text-white/90">
          Explore
        </span>
      </div>
    </Link>
  );
}
