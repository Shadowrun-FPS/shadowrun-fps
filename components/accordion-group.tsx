import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

type AccordionGroupProps = {
  title: string;
  accordions: AccoridonType[];
};

export type AccoridonType = {
  title: string;
  content?: string;
  href?: string;
  link?: string;
  list?: string[];
};

export default function AccordionGroup({
  title,
  accordions,
}: AccordionGroupProps) {
  return (
    <div>
      <h2 className="my-8 text-4xl font-bold prose dark:prose-invert">
        {title}
      </h2>
      <Accordion type="single" collapsible>
        {accordions.map((item, i) => (
          <AccordionItem value={"item" + i}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>
              {item.content}
              {item.link && item.href && (
                <Link href={item.href}>{item.link}</Link>
              )}
              {item.list && <List list={item.list} />}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function List({ list }: { list: string[] }) {
  return (
    <ul className="prose dark:prose-invert">
      {list.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}
