import { Utensils, Cpu, BookOpen, Shirt, Wrench, Package } from "lucide-react";
export const CATEGORIES = [
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Electronics", label: "Electronics", icon: Cpu },
  { value: "Books", label: "Books", icon: BookOpen },
  { value: "Clothing", label: "Clothing", icon: Shirt },
  { value: "Services", label: "Services", icon: Wrench },
  { value: "Other", label: "Other", icon: Package },
] as const;
