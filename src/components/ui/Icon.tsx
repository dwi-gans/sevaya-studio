import React from 'react';
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Star,
  Bookmark,
  Leaf,
  Mail,
  Lock,
  MessageCircle,
  Check,
  CheckCircle2,
  Truck,
  Sparkles,
  HeartHandshake,
  Hourglass,
  Eye,
  EyeOff,
  BadgeCheck,
  Minus,
  Flower2,
  BookOpen,
  Home,
  RefreshCw,
  ShieldCheck,
  Info,
  Zap,
  Wand2,
  CreditCard,
  Heart,
  MapPin,
  Fingerprint,
  Shirt,
  Shield,
  Scissors,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  LucideIcon,
  LogOut,
  ReceiptText,
  PackageCheck,
  ExternalLink,
  Printer,
  Ban,
  Inbox,
  WifiOff,
  Clock,
  Banknote,
  Package,
  SlidersHorizontal,
  SearchX,
  Settings,
  AlertCircle,
  Store,
  Copy,
  MailCheck,
  Send,
  Link2Off,
  Circle,
  ArrowUpRight,
  Bell,
  ImagePlus,
  UploadCloud,
  Filter,
  Table,
  Images,
  LayoutGrid,
  PanelLeftClose,
  PanelLeft,
  Newspaper,
} from 'lucide-react';

export type IconName =
  | 'menu'
  | 'menu_open'
  | 'dock_to_left'
  | 'draw'
  | 'search'
  | 'shopping_bag'
  | 'person'
  | 'add'
  | 'arrow_forward'
  | 'arrow_back'
  | 'close'
  | 'expand_more'
  | 'expand_less'
  | 'chevron_right'
  | 'chevron_left'
  | 'star'
  | 'bookmark'
  | 'eco'
  | 'mail'
  | 'lock'
  | 'chat'
  | 'check'
  | 'check_circle'
  | 'local_shipping'
  | 'style'
  | 'handshake'
  | 'hourglass_top'
  | 'visibility'
  | 'visibility_off'
  | 'verified'
  | 'remove'
  | 'spa'
  | 'keyboard_arrow_down'
  | 'auto_stories'
  | 'home'
  | 'published_with_changes'
  | 'verified_user'
  | 'info'
  | 'bolt'
  | 'styler'
  | 'task_alt'
  | 'auto_fix_high'
  | 'credit_card'
  | 'texture'
  | 'favorite'
  | 'favorite_border'
  | 'dry_cleaning'
  | 'volunteer_activism'
  | 'shield'
  | 'cloud_sync'
  | 'location_on'
  | 'fingerprint'
  | 'edit'
  | 'delete'
  | 'upload'
  | 'image'
  | 'logout'
  | 'receipt_long'
  | 'inventory_2'
  | 'open_in_new'
  | 'print'
  | 'cancel'
  | 'inbox'
  | 'cloud_off'
  | 'schedule'
  | 'payments'
  | 'list_alt'
  | 'tune'
  | 'search_off'
  | 'settings'
  | 'error'
  | 'storefront'
  | 'content_copy'
  | 'mark_email_read'
  | 'send'
  | 'link_off'
  | 'refresh'
  | 'radio_button_unchecked'
  | 'checkroom'
  | 'view_quilt'
  | 'photo_library'
  | 'perm_media'
  | 'north_east'
  | 'notifications'
  | 'add_photo_alternate'
  | 'cloud_upload'
  | 'filter_alt'
  | 'grid_view'
  | 'table_rows'
  | 'newspaper'
  | 'done';

const ICON_MAP: Record<IconName, LucideIcon> = {
  menu: Menu,
  menu_open: PanelLeftClose,
  dock_to_left: PanelLeft,
  draw: Scissors,
  search: Search,
  shopping_bag: ShoppingBag,
  tune: SlidersHorizontal,
  search_off: SearchX,
  person: User,
  add: Plus,
  arrow_forward: ArrowRight,
  arrow_back: ArrowLeft,
  close: X,
  expand_more: ChevronDown,
  expand_less: ChevronUp,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  star: Star,
  bookmark: Bookmark,
  eco: Leaf,
  mail: Mail,
  lock: Lock,
  chat: MessageCircle,
  check: Check,
  check_circle: CheckCircle2,
  local_shipping: Truck,
  style: Sparkles,
  handshake: HeartHandshake,
  hourglass_top: Hourglass,
  visibility: Eye,
  visibility_off: EyeOff,
  verified: BadgeCheck,
  remove: Minus,
  spa: Flower2,
  keyboard_arrow_down: ChevronDown,
  auto_stories: BookOpen,
  home: Home,
  published_with_changes: RefreshCw,
  verified_user: ShieldCheck,
  info: Info,
  bolt: Zap,
  styler: Sparkles,
  task_alt: CheckCircle2,
  auto_fix_high: Wand2,
  credit_card: CreditCard,
  texture: Sparkles,
  favorite: Heart,
  favorite_border: Heart,
  dry_cleaning: Shirt,
  volunteer_activism: HeartHandshake,
  shield: Shield,
  cloud_sync: RefreshCw,
  location_on: MapPin,
  fingerprint: Fingerprint,
  edit: Pencil,
  delete: Trash2,
  upload: Upload,
  image: ImageIcon,
  logout: LogOut,
  receipt_long: ReceiptText,
  inventory_2: PackageCheck,
  open_in_new: ExternalLink,
  print: Printer,
  cancel: Ban,
  inbox: Inbox,
  cloud_off: WifiOff,
  schedule: Clock,
  payments: Banknote,
  list_alt: Package,
  settings: Settings,
  error: AlertCircle,
  storefront: Store,
  content_copy: Copy,
  mark_email_read: MailCheck,
  send: Send,
  link_off: Link2Off,
  refresh: RefreshCw,
  radio_button_unchecked: Circle,
  checkroom: Shirt,
  view_quilt: LayoutGrid,
  photo_library: Images,
  perm_media: Images,
  north_east: ArrowUpRight,
  notifications: Bell,
  add_photo_alternate: ImagePlus,
  cloud_upload: UploadCloud,
  filter_alt: Filter,
  grid_view: LayoutGrid,
  table_rows: Table,
  newspaper: Newspaper,
  done: Check,
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, size = 20, className = '', filled = false, ...props }: IconProps) {
  const Component = ICON_MAP[name] || Sparkles;

  return (
    <Component
      size={size}
      className={`inline-block shrink-0 ${filled ? 'fill-current' : ''} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
