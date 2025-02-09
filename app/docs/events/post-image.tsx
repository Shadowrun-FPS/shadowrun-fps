import Image from "next/image";
import Link from "next/link";

interface PostImageProps {
  src: string;
  alt: string;
  href: string;
  className?: string; // Allow className prop
}

export default function PostImage({
  src,
  alt,
  href,
  className,
}: PostImageProps) {
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  const image = (
    <Image
      src={src}
      alt={alt}
      fill={true}
      style={{
        objectFit: "cover",
      }}
      unoptimized={isExternal}
      className={className} // Apply className to the image
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        className={`relative block w-full h-64 ${className || ""}`}
      >
        {image}
      </Link>
    );
  } else {
    return (
      <div className={`relative w-full h-64 ${className || ""}`}>{image}</div>
    );
  }
}
