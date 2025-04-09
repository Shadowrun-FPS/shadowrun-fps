declare module "leo-profanity" {
  interface LeoProfanity {
    list: () => string[];
    add: (words: string | string[]) => void;
    remove: (words: string | string[]) => void;
    reset: () => void;
    clearList: () => void;
    check: (text: string) => boolean;
    clean: (text: string, replaceKey?: string) => string;
    getDictionary: () => { [key: string]: string[] };
    loadDictionary: (name: string) => void;
  }

  const leoProfanity: LeoProfanity;
  export default leoProfanity;
}
