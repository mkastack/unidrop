import { Utensils, Cpu, BookOpen, Shirt, Wrench, Package, ShoppingBasket, Headphones } from "lucide-react";
export const CATEGORIES = [
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Provisions", label: "Provisions", icon: ShoppingBasket },
  { value: "Electronics", label: "Electronics", icon: Cpu },
  { value: "Accessories", label: "Accessories", icon: Headphones },
  { value: "Books", label: "Books", icon: BookOpen },
  { value: "Clothing", label: "Clothing", icon: Shirt },
  { value: "Other", label: "Other", icon: Package },
] as const;
