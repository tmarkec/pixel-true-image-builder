// Edit any of these lists to change the dropdowns across the site.
// Values marked "fixed in database" must match the database rules, so ask before changing them.

export const LISTING_TYPES = [
  { value: "have", label: "Have" },
  { value: "want", label: "Want" },
] as const; // fixed in database

export const BRANDS = ["Concept2", "Croker", "Other"] as const;

export const DISCIPLINES = ["Sweep", "Scull"] as const; // fixed in database

export const SIDES = ["Bow", "Stroke", "Unspecified / Either"] as const; // fixed in database

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 16; // fixed in database

export const QUANTITY_PRESETS = [1, 2, 4, 8] as const;

// Spec dropdowns change with the brand. Edit freely; these are not fixed in the database.
// sleeve: Croker only. grip: Croker grip/handle. handle: Concept2 / Other handle.
// length: null means free-text length.
export type BrandSpecs = {
  blade: readonly string[];
  shaft?: readonly string[];
  sleeve?: readonly string[];
  handle?: readonly string[];
  grip?: readonly string[];
  softness?: readonly string[];
  length: readonly string[] | null;
};

export const BRAND_SPECS: Record<string, BrandSpecs> = {
  Concept2: {
    blade: [
      "Macon (1976/1980)", "Big (1991)", "Smoothie1 (1996)", "Fat2 (2004)", "Smoothie2 Plain (2006)",
      "Smoothie2 Vortex (2006)", "Bantam (2015)", "Comp (2019)", "Unknown / Other",
    ],
    shaft: ["Ultralight (1997)", "Low-i (2004)", "Skinny (2011)", "Skinny Coastal", "Blade only", "Unknown"],
    handle: ["10cm Adjustable (1995)", "5cm Adjustable (2005)", "Fixed (Wood/Alloy/Composite)", "Blade only", "Unknown"],
    softness: ["Extra soft", "Soft", "Medium", "Stiff", "Unknown"],
    length: [
      "Fat Short (275-280cm)", "Fat Medium (278-283cm)", "Short (281-286cm)", "Medium (284-289cm)",
      "Long (287-292cm)", "Blade only",
    ],
  },
  Croker: {
    blade: [
      "Macon (1990)", "Cleaver (1992)", "Droop Snoot (1997)", "Slick (2002)", "Slick Round (2010)",
      "Arrow (2015)", "Unknown / Other",
    ],
    sleeve: ["MK1 Sleeve (1992)", "MK3 Sleeve (2005)", "MK4 Sleeve (2022)", "No sleeve", "Unknown"],
    grip: [
      "Pink - Small (31mm)", "Yellow - Intermediate (34mm)", "Blue - Standard (35mm)", "Grey - Large (37mm)",
      "Green - Extra-Large (39mm)", "Fixed wood", "Unknown / Missing grip",
    ],
    softness: ["Soft", "Medium", "Stiff", "Unknown"],
    length: ["Standard scull/sweep lengths", "Custom", "Blade only", "Unknown"],
  },
  Other: {
    blade: ["Hatchet / cleaver", "Macon", "Wooden", "Unknown"],
    shaft: ["Carbon", "Wood", "Aluminium", "Unknown"],
    handle: ["Adjustable", "Fixed", "Unknown"],
    length: null,
  },
};

// Irish rowing clubs for the club picker. People can also type their own.
export const CLUBS = [
  "Athlone BC", "Bann RC", "Belfast BC", "Bush RC", "Carlow RC", "Castleconnell BC", "Clonmel RC",
  "Commercial RC", "Cork BC", "DCU", "Dublin University BC (Trinity)", "Fermoy RC", "Galway RC",
  "Lady Elizabeth BC", "Lee RC", "Limerick BC", "Methodist College", "Muckross RC",
  "Neptune RC", "NUIG BC", "Old Collegians BC", "Portora BC", "Presentation College Cork", "Queen's University BC",
  "Shandon BC", "Skibbereen RC", "St. Michael's RC", "Three Castles BC", "Tribesmen RC", "UCC RC", "UCD BC",
  "University of Limerick RC", "Waterford BC", "Workmans BC",
];

export const CONDITIONS = ["New", "Good", "Worn", "Damaged / for parts"] as const; // fixed in database

export const OFFER_TYPES = ["Free", "Swap", "Price negotiable", "Fixed price"] as const; // fixed in database

export const LISTING_STATUSES = ["active", "matched", "archived", "hidden"] as const; // fixed in database

export const LISTING_DAYS = 60;

export const MAX_ACTIVE_LISTINGS = 20;
export const MAX_DAILY_LISTINGS = 10;
export const EXPIRY_WARNING_DAYS = 7;

export const COUNTIES = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal",
  "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois",
  "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly",
  "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow",
] as const;

export const REPORT_REASONS = [
  "Already gone",
  "Wrong details",
  "Spam or not an oar",
  "Something else",
] as const;
