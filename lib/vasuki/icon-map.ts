/**
 * Lucide icon resolver and mapping layer for VasukiSquare publications.
 * Translates persisted icon strings (kebab-case, snake_case, lowercase) to normalized Lucide icon names.
 */

export const KNOWN_VASUKI_ICONS: Record<string, string> = {
  // General & Editorial
  sparkles: "Sparkles",
  book: "Book",
  "book-open": "BookOpen",
  book_open: "BookOpen",
  bookmark: "Bookmark",
  layers: "Layers",
  feather: "Feather",
  file: "File",
  "file-text": "FileText",
  file_text: "FileText",
  list: "List",
  "list-ordered": "ListOrdered",
  list_ordered: "ListOrdered",

  // Technical & Developer
  code: "Code",
  terminal: "Terminal",
  cpu: "Cpu",
  database: "Database",
  server: "Server",
  shield: "Shield",
  "shield-check": "ShieldCheck",
  shield_check: "ShieldCheck",
  zap: "Zap",
  compass: "Compass",
  git: "GitBranch",
  "git-branch": "GitBranch",
  git_branch: "GitBranch",
  workflow: "Workflow",
  network: "Network",
  hard_drive: "HardDrive",
  "hard-drive": "HardDrive",

  // Feedback & Status
  check: "Check",
  "check-circle": "CheckCircle",
  check_circle: "CheckCircle",
  x: "X",
  "x-circle": "XCircle",
  x_circle: "XCircle",
  info: "Info",
  "alert-triangle": "AlertTriangle",
  alert_triangle: "AlertTriangle",
  "alert-circle": "AlertCircle",
  alert_circle: "AlertCircle",
  help_circle: "HelpCircle",
  "help-circle": "HelpCircle",
  lightbulb: "Lightbulb",

  // Data & Visuals
  "bar-chart": "BarChart3",
  bar_chart: "BarChart3",
  "trending-up": "TrendingUp",
  trending_up: "TrendingUp",
  activity: "Activity",
  pie_chart: "PieChart",
  "pie-chart": "PieChart",
  clock: "Clock",
  calendar: "Calendar",
  target: "Target",
  award: "Award",
  external_link: "ExternalLink",
  "external-link": "ExternalLink",
};

/**
 * Normalizes an arbitrary icon string from MongoDB into a standard Lucide icon name.
 */
export function resolveVasukiIconName(iconName?: string | null, fallback = "Sparkles"): string {
  if (!iconName || typeof iconName !== "string") {
    return fallback;
  }

  const clean = iconName.trim().toLowerCase();
  if (KNOWN_VASUKI_ICONS[clean]) {
    return KNOWN_VASUKI_ICONS[clean];
  }

  // Convert kebab-case or snake_case to PascalCase (e.g. check-circle -> CheckCircle)
  const pascal = clean
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return pascal || fallback;
}

