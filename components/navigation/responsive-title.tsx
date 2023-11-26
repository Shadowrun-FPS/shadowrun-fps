type ResponsitveTitleProps = {
  title: string;
  icon: JSX.Element;
};

export default function ResponsitveTitle({
  title,
  icon,
}: ResponsitveTitleProps) {
  return (
    <>
      <div className="hidden md:inline-block">
        <span>{title}</span>
      </div>
      <div className="inline-block md:hidden">{icon}</div>
    </>
  );
}
