/** FAQ document as stored and served for the troubleshoot page. */
export interface FAQ {
  _id: string;
  title: string;
  content: string;
  list: string[];
  href: string;
  link: string;
  category: string;
  order: number;
}

/** Values the FAQ editor submits when creating or editing. */
export interface FAQFormValues {
  _id?: string;
  title: string;
  content: string;
  list: string[];
  href: string;
  link: string;
  category: string;
}
