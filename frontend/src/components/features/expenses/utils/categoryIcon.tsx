import {
  Beer, Pill, Pizza, Coffee, ShoppingBag, Package, Tag, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  beer:            Beer,
  pill:            Pill,
  pizza:           Pizza,
  coffee:          Coffee,
  'shopping-bag':  ShoppingBag,
  package:         Package,
};

export function getCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Tag;
  return ICON_MAP[icon] ?? Tag;
}
