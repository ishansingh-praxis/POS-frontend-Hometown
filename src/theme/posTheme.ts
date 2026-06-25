export const COLORS = {
  purple: "#6F42C1",
  blue: "#007BFF",
  aqua: "#00CCCC",
  cyan: "#0DCAF0",
  teal: "#17A2B8",
  coral: "#FE9496",
  deepPurple: "#4B49AC",
  sky: "#98BDFF",
  rose: "#F3797E",
  indigo: "#7978E9",
  softBlue: "#7DA0FA",
  orange: "#F29F67",
  gold: "#E0B50F",

  pageBg: "#F6F8FF",
  card: "#FFFFFF",
  border: "#E6EAFE",
  text: "#172033",
  muted: "#6B7280",
};

export const ROLE_THEME = {
  CASHIER: {
    header: "linear-gradient(135deg, #007BFF 0%, #4B49AC 100%)",
    primary: COLORS.blue,
    secondary: COLORS.deepPurple,
    soft: COLORS.sky,
    action: COLORS.aqua,
  },

  MANAGER: {
    header: "linear-gradient(135deg, #4B49AC 0%, #7DA0FA 100%)",
    primary: COLORS.deepPurple,
    secondary: COLORS.softBlue,
    soft: COLORS.sky,
    action: COLORS.cyan,
  },

  ADMIN: {
    header: "linear-gradient(135deg, #6F42C1 0%, #4B49AC 100%)",
    primary: COLORS.purple,
    secondary: COLORS.deepPurple,
    soft: COLORS.indigo,
    action: COLORS.blue,
  },
};

export const SEMANTIC_COLORS = {
  sales: COLORS.gold,
  billing: COLORS.blue,
  session: COLORS.cyan,
  customer: COLORS.aqua,
  success: COLORS.teal,
  inventory: COLORS.softBlue,
  analytics: COLORS.indigo,
  pending: COLORS.orange,
  partial: COLORS.orange,
  held: COLORS.orange,
  return: COLORS.rose,
  creditNote: COLORS.rose,
  risk: COLORS.coral,
  exception: COLORS.coral,
  report: COLORS.deepPurple,
};
