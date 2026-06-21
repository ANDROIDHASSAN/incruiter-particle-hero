// Brand + visual design tokens for the InCruiter particle hero.
// Deep corporate navy base; boldness spent only on the particle glow.

export const PALETTE = {
  deepNavy: '#0a2342', // background base
  brand: '#133f7d', // InCruiter primary (theme-color)
  electric: '#2f6fed', // particle core
  cyan: '#4fd1ff', // accent / highlights
  white: '#eaf2ff', // hottest particle tips
};

// Product metadata. ORDER IS CONTRACTUAL: it must match the shape index
// order in shapes/index.js so the overlay label stays in sync with the cloud.
// Each product carries a subtle accent within a cohesive cool/luxury spectrum,
// so the cloud's color shifts identity as you scroll — memorable, never garish.
export const PRODUCTS = [
  {
    key: 'brain',
    name: 'Augmented AI',
    tagline: 'Precision hiring, powered by AI',
    accent: '#4fd1ff',
  },
  {
    key: 'incserve',
    name: 'IncServe',
    tagline: 'Interview as a Service — 4500+ expert interviewers',
    accent: '#3ee0c0',
  },
  { key: 'incbot', name: 'IncBot', tagline: 'AI Interview Software', accent: '#4f9bff' },
  {
    key: 'incscreen',
    name: 'IncScreen',
    tagline: 'Conversational AI Recruiter',
    accent: '#7c8cff',
  },
  { key: 'incvid', name: 'IncVid', tagline: 'Video Interview Software', accent: '#9f7bff' },
  {
    key: 'incfeed',
    name: 'IncFeed',
    tagline: 'Interview Scheduling Software',
    accent: '#5fa8ff',
  },
  {
    key: 'incproctor',
    name: 'IncProctor',
    tagline: 'Online Proctoring Software',
    accent: '#4fd1ff',
  },
];

export const NUM_SHAPES = PRODUCTS.length; // 7
