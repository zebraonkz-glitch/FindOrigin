export type InputKind = "text" | "telegram_post_url";

export type ExtractedInput = {
  kind: InputKind;
  rawInput: string;
  text: string;
};

export type ExtractedEntities = {
  rawText: string;
  claims: string[];
  dates: string[];
  numbers: string[];
  names: string[];
  links: string[];
};

export type SearchQueries = {
  primary: string;
  secondary: string[];
};

export type EntityExtractionResult = {
  entities: ExtractedEntities;
  queries: SearchQueries;
};
