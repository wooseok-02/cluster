export interface PersonNode {
  id: number;
  name: string;
  status: "new" | "best" | "normal" | "old";
  relation: string;
  count: number;
}

export const MOCK_PEOPLE: PersonNode[] = [
  { id: 1, name: "Kim", status: "best", relation: "friend", count: 32 },
  { id: 2, name: "Lee", status: "new", relation: "colleague", count: 2 },
  { id: 3, name: "Park", status: "normal", relation: "friend", count: 12 },
  { id: 4, name: "Choi", status: "old", relation: "classmate", count: 5 },
  { id: 5, name: "Jung", status: "best", relation: "family", count: 48 },
  { id: 6, name: "Kang", status: "new", relation: "colleague", count: 1 },
  { id: 7, name: "Yoon", status: "normal", relation: "friend", count: 8 },
  { id: 8, name: "Shin", status: "old", relation: "neighbor", count: 3 },
  { id: 9, name: "Han", status: "normal", relation: "friend", count: 15 },
  { id: 10, name: "Seo", status: "new", relation: "colleague", count: 1 },
];

export const STATUS_CONFIG = {
  new: {
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.5)",
    glowColor: "rgba(34, 197, 94, 0.3)",
    label: "NEW",
  },
  best: {
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.5)",
    glowColor: "rgba(245, 158, 11, 0.3)",
    label: "BEST",
  },
  normal: {
    color: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.5)",
    glowColor: "rgba(99, 102, 241, 0.3)",
    label: "NORMAL",
  },
  old: {
    color: "#94a3b8",
    bgColor: "rgba(148, 163, 184, 0.15)",
    borderColor: "rgba(148, 163, 184, 0.5)",
    glowColor: "rgba(148, 163, 184, 0.3)",
    label: "OLD",
  },
} as const;
