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

export const BLADE_TYPES = [
  "Smoothie2 Vortex Edge",
  "Smoothie2 Plain Edge",
  "Big Blade",
  "Fat2",
  "Comp",
  "Macon",
  "Other",
] as const;

export const SHAFT_TYPES = ["Skinny", "Ultralight", "Standard", "Wood", "Other"] as const;

export const SHAFT_SOFTNESS = ["Soft", "Medium", "Stiff", "Not sure"] as const;

export const SLEEVE_TYPES = ["Plastic", "Composite", "Wood", "Other"] as const;

export const HANDLE_TYPES = ["Adjustable", "Fixed"] as const;

export const GRIP_TYPES = ["Rubber", "Wood", "Foam", "Other"] as const;

export const LENGTHS = [
  "Under 280cm",
  "280-289cm",
  "290-299cm",
  "360-369cm",
  "370-379cm",
  "380cm and over",
  "Not sure",
] as const;

export const CONDITIONS = ["New", "Good", "Worn", "Damaged / for parts"] as const; // fixed in database

export const OFFER_TYPES = ["Free", "Swap", "Price negotiable", "Fixed price"] as const; // fixed in database

export const LISTING_STATUSES = ["active", "matched", "archived", "hidden"] as const; // fixed in database

export const LISTING_DAYS = 60;

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
