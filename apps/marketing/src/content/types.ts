export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  description: string;
  path: string;
  updated: string;
  sections: LegalSection[];
}
