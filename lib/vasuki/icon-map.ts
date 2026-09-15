import React from "react";
import * as LucideIcons from "lucide-react";

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
  "file-code": "FileCode",
  file_code: "FileCode",
  list: "List",
  "list-ordered": "ListOrdered",
  list_ordered: "ListOrdered",
  heart: "Heart",
  compass: "Compass",
  globe: "Globe",
  eye: "Eye",
  search: "Search",

  // Technical & Developer
  code: "Code",
  "code-2": "Code2",
  code_2: "Code2",
  braces: "Braces",
  terminal: "Terminal",
  "square-terminal": "SquareTerminal",
  square_terminal: "SquareTerminal",
  cpu: "Cpu",
  database: "Database",
  server: "Server",
  shield: "Shield",
  "shield-check": "ShieldCheck",
  shield_check: "ShieldCheck",
  lock: "Lock",
  zap: "Zap",
  git: "GitBranch",
  "git-branch": "GitBranch",
  git_branch: "GitBranch",
  workflow: "Workflow",
  network: "Network",
  hard_drive: "HardDrive",
  "hard-drive": "HardDrive",
  gauge: "Gauge",
  activity: "Activity",

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

/**
 * Map of Lucide components for instant direct lookup.
 */
const ICON_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string; size?: number | string; style?: React.CSSProperties }>> = {
  Sparkles: LucideIcons.Sparkles,
  Book: LucideIcons.Book,
  BookOpen: LucideIcons.BookOpen,
  Bookmark: LucideIcons.Bookmark,
  Layers: LucideIcons.Layers,
  Feather: LucideIcons.Feather,
  File: LucideIcons.File,
  FileText: LucideIcons.FileText,
  FileCode: LucideIcons.FileCode,
  List: LucideIcons.List,
  ListOrdered: LucideIcons.ListOrdered,
  Heart: LucideIcons.Heart,
  Compass: LucideIcons.Compass,
  Globe: LucideIcons.Globe,
  Eye: LucideIcons.Eye,
  Search: LucideIcons.Search,
  Code: LucideIcons.Code,
  Code2: LucideIcons.Code2,
  Braces: LucideIcons.Braces,
  Terminal: LucideIcons.Terminal,
  SquareTerminal: LucideIcons.SquareTerminal,
  Cpu: LucideIcons.Cpu,
  Database: LucideIcons.Database,
  Server: LucideIcons.Server,
  Shield: LucideIcons.Shield,
  ShieldCheck: LucideIcons.ShieldCheck,
  Lock: LucideIcons.Lock,
  Zap: LucideIcons.Zap,
  GitBranch: LucideIcons.GitBranch,
  Workflow: LucideIcons.Workflow,
  Network: LucideIcons.Network,
  HardDrive: LucideIcons.HardDrive,
  Gauge: LucideIcons.Gauge,
  Activity: LucideIcons.Activity,
  Check: LucideIcons.Check,
  CheckCircle: LucideIcons.CheckCircle,
  X: LucideIcons.X,
  XCircle: LucideIcons.XCircle,
  Info: LucideIcons.Info,
  AlertTriangle: LucideIcons.AlertTriangle,
  AlertCircle: LucideIcons.AlertCircle,
  HelpCircle: LucideIcons.HelpCircle,
  Lightbulb: LucideIcons.Lightbulb,
  BarChart3: LucideIcons.BarChart3,
  TrendingUp: LucideIcons.TrendingUp,
  PieChart: LucideIcons.PieChart,
  Clock: LucideIcons.Clock,
  Calendar: LucideIcons.Calendar,
  Target: LucideIcons.Target,
  Award: LucideIcons.Award,
  ExternalLink: LucideIcons.ExternalLink,
  ChevronLeft: LucideIcons.ChevronLeft,
  ChevronRight: LucideIcons.ChevronRight,
  Maximize: LucideIcons.Maximize,
  Minimize: LucideIcons.Minimize,
  Columns2: LucideIcons.Columns2,
  Square: LucideIcons.Square,
  ZoomIn: LucideIcons.ZoomIn,
  ZoomOut: LucideIcons.ZoomOut,
  RotateCcw: LucideIcons.RotateCcw,
  Copy: LucideIcons.Copy,
  CheckCheck: LucideIcons.CheckCheck,
};

/**
 * Resolves a Lucide React component for a given icon string name with a fallback.
 */
export function getVasukiIconComponent(
  iconName?: string | null,
  fallback = "Sparkles"
): React.ComponentType<{ className?: string; size?: number | string; style?: React.CSSProperties }> {
  const resolvedName = resolveVasukiIconName(iconName, fallback);
  return ICON_COMPONENT_MAP[resolvedName] || ICON_COMPONENT_MAP[fallback] || LucideIcons.Sparkles;
}
