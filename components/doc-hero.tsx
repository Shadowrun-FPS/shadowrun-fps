type DocHeroProps = {
  title: string;
  content?: string;
};

export function DocHero({ title, content }: DocHeroProps) {
  return (
    <div className="flex items-start h-64 bg-center bg-no-repeat bg-cover bg-hero-image">
      <div className="p-8 prose dark:prose-invert">
        <h1 className="font-extrabold">{title}</h1>
        {content && <p>{content}</p>}
      </div>
    </div>
  );
}
