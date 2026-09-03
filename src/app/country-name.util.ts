const COMMON_NAME_OVERRIDES: Record<string, string> = {
  'united states of america': 'United States',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'russian federation': 'Russia',
  'iran (islamic republic of)': 'Iran',
  'iran, islamic republic of': 'Iran',
  "lao people's democratic republic": 'Laos',
  'syrian arab republic': 'Syria',
  'venezuela (bolivarian republic of)': 'Venezuela',
  'venezuela, bolivarian republic of': 'Venezuela',
  'bolivia (plurinational state of)': 'Bolivia',
  'bolivia, plurinational state of': 'Bolivia',
  'viet nam': 'Vietnam',
  'brunei darussalam': 'Brunei',
};

// Names that would collide with each other if we just cut off text after a
// comma or bracket (e.g. both Koreas contain "korea"), so they're matched
// by keyword instead of an exact key.
function specialCase(lower: string): string | null {
  if (lower.includes('korea')) {
    return lower.includes('democratic') || lower.includes('north') ? 'North Korea' : 'South Korea';
  }
  if (lower.includes('congo')) {
    return lower.includes('democratic') ? 'DR Congo' : 'Congo';
  }
  if (lower.includes('micronesia')) return 'Micronesia';
  if (lower.includes('moldova')) return 'Moldova';
  if (lower.includes('tanzania')) return 'Tanzania';
  if (lower.includes('netherlands')) return 'Netherlands';
  return null;
}

export function toCommonName(officialName: string): string {
  const trimmed = officialName.trim();
  const lower = trimmed.toLowerCase();

  if (COMMON_NAME_OVERRIDES[lower]) {
    return COMMON_NAME_OVERRIDES[lower];
  }

  const special = specialCase(lower);
  if (special) return special;

  // Strip a trailing "(...)" suffix, e.g. "X (Something of)" -> "X"
  const noParens = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (noParens !== trimmed) {
    return noParens || trimmed;
  }

  // Cut at the first comma, e.g. "Palestine, State of" -> "Palestine"
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex > 0) {
    return trimmed.slice(0, commaIndex).trim();
  }

  return trimmed;
}

// For a few names above, the short name isn't a literal substring of the
// official name, so the API's name-search wouldn't find it. This maps
// those to a safe search term instead.
const SEARCH_TERM_OVERRIDES: Record<string, string> = {
  'laos': 'lao',
  'south korea': 'korea',
  'north korea': 'korea',
  'dr congo': 'congo',
  'vietnam': 'viet',
};

export function toSearchTerm(input: string): string {
  const lower = input.trim().toLowerCase();
  return SEARCH_TERM_OVERRIDES[lower] || input.trim();
}