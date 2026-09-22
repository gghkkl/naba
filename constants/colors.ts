export type ThemePalette = {
  text: string;
  tint: string;
  background: string;
  backgroundGradient: [string, string, string];
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryDark: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  borderStrong: string;
  input: string;
  gold: string;
  goldLight: string;
  glass: string;
  glassBorder: string;
  primarySoft: string;
  secondarySoft: string;
  scrim: string;
  overlay: string;
  pageText: string;
  pageMuted: string;
  logoBackdrop: string;
};

const dark: ThemePalette = {
  text: "#E8E0CC",
  tint: "#005A56",
  background: "#080E0C",
  backgroundGradient: ["#080E0C", "#0B1914", "#080E0C"],
  foreground: "#E8E0CC",
  card: "#0F1C18",
  cardForeground: "#E8E0CC",
  primary: "#005A56",
  primaryDark: "#003D3A",
  primaryForeground: "#FFFFFF",
  secondary: "#B8A46A",
  secondaryForeground: "#0A0A0A",
  muted: "#132018",
  mutedForeground: "#7A9590",
  accent: "#B8A46A",
  accentForeground: "#0A0A0A",
  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
  border: "#1A2E28",
  borderStrong: "rgba(232,224,204,0.62)",
  input: "#1A2E28",
  gold: "#B8A46A",
  goldLight: "#D4C08A",
  glass: "rgba(10,20,16,0.88)",
  glassBorder: "rgba(232,224,204,0.16)",
  primarySoft: "rgba(0,90,86,0.18)",
  secondarySoft: "rgba(184,164,106,0.10)",
  scrim: "rgba(0,0,0,0.65)",
  overlay: "rgba(8,14,12,0.20)",
  pageText: "#E8E0CC",
  pageMuted: "#7A9590",
  logoBackdrop: "#080E0C",
};

const light: ThemePalette = {
  text: "#263A37",
  tint: "#087A70",
  background: "#F6F4EE",
  backgroundGradient: ["#F9F8F3", "#EEF5F0", "#F6F4EE"],
  foreground: "#263A37",
  card: "#FFFEFA",
  cardForeground: "#263A37",
  primary: "#087A70",
  primaryDark: "#075F58",
  primaryForeground: "#FFFFFF",
  secondary: "#A57C26",
  secondaryForeground: "#FFFFFF",
  muted: "#E8F0EC",
  mutedForeground: "#58716B",
  accent: "#A57C26",
  accentForeground: "#FFFFFF",
  destructive: "#C53B3B",
  destructiveForeground: "#FFFFFF",
  border: "#D5E1DC",
  borderStrong: "#C5D5CF",
  input: "#FFFFFF",
  gold: "#A57C26",
  goldLight: "#C69B42",
  glass: "rgba(255,255,255,0.88)",
  glassBorder: "rgba(38,58,55,0.14)",
  primarySoft: "rgba(8,122,112,0.12)",
  secondarySoft: "rgba(165,124,38,0.12)",
  scrim: "rgba(35,48,45,0.34)",
  overlay: "rgba(246,244,238,0.26)",
  pageText: "#263A37",
  pageMuted: "#58716B",
  logoBackdrop: "#080E0C",
};

const colors = {
  dark,
  light,
  radius: 16,
};

export default colors;