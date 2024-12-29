import Image from "next/image";
import Link from "next/link";

type PostImageProps = {
  src: string;
  alt: string;
  href: string;
};

export default function PostImage({ src, alt, href }: PostImageProps) {
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  const image = isExternal ? (
    <img
      src={src}
      alt={alt}
      style={{
        objectFit: "cover",
        width: "100%",
        height: "100%",
      }}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      fill={true}
      style={{
        objectFit: "cover",
        width: "100%",
        height: "100%",
      }}
    />
  );

  if (href) {
    return (
      <Link href={href} target="_blank">
        {image}
      </Link>
    );
  } else {
    return image;
  }
}
