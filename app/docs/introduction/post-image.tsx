import Image from "next/image";
import Link from "next/link";

type PostImageProps = {
  src: string;
  alt: string;
  href: string;
};

export default function PostImage({ src, alt, href }: PostImageProps) {
  const image = (
    <Image
      src={src}
      alt={alt}
      fill={true}
      style={{
        objectFit: "cover", // cover, contain, none
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
