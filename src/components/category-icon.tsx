import {
  BriefcaseBusiness,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleEllipsis,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Plane,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UsersRound,
  Utensils,
  WalletCards,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  BriefcaseBusiness,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleEllipsis,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Plane,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UsersRound,
  Utensils,
  WalletCards,
  Wifi,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? CircleDollarSign;
  return <Icon aria-hidden="true" className={cn("size-4", className)} />;
}
