'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Top Bar & Header
    'announcement.shipping': 'Gratis Ongkos Kirim untuk Pesanan di Atas Rp 2.000.000',
    'announcement.subsidy': '(subsidi maks. 50rb)',
    'nav.home': 'Beranda',
    'nav.collection': 'Koleksi',
    'nav.lookbook': 'Lookbook',
    'nav.shop': 'Katalog',
    'nav.about': 'Tentang Kami',
    'nav.news': 'Jurnal',
    'nav.bag': 'Tas Belanja',
    'nav.search_placeholder': 'Cari siluet, bahan, Bemberg, abaya...',
    'nav.trending': 'Pencarian Populer',

    // Drawer
    'drawer.sign_in': 'Masuk / Daftar',
    'drawer.sign_in_sub': 'Akses hak istimewa & koleksi tersimpan',
    'drawer.sign_out': 'Keluar Akun',
    'drawer.categories': 'Kategori Pilihan',
    'drawer.collections': 'Koleksi & Lookbook',
    'drawer.care': 'Konsultasi & Layanan',
    'drawer.all_silhouettes': 'Semua Siluet',
    'drawer.abayas_kaftans': 'Abaya & Kaftan',
    'drawer.outerwear': 'Outerwear & Kimono',
    'drawer.inner_slips': 'Inner Slips Esensial',
    'drawer.scarves': 'Hijab & Selendang Sutra',
    'drawer.accessories': 'Aksesoris Sevaya',
    'drawer.vip_styling': 'Konsultasi VIP WhatsApp',
    'drawer.shipping_returns': 'Pengiriman & Kebijakan Retur',

    // Home - Countdown
    'home.countdown_ends': 'Kapsul Rilis Berakhir Dalam:',
    'home.days': 'h',
    'home.hours': 'j',
    'home.minutes': 'm',
    'home.seconds': 'd',

    // Home - Hero
    'hero.badge': 'Rilis Terbaru • Chapter III',
    'hero.title': '26° Rhapsody',
    'hero.desc': 'Siluet mengalir bebas, ekspresif, dan harmonis dalam ketenangan yang dirancang untuk iklim tropis.',
    'hero.tagline': 'ABADI • BERMAKNA • ANGGUN',
    'hero.cta_lookbook': 'Lookbook',
    'hero.cta_shop': 'Jelajahi Koleksi',

    // Home - Category Tabs
    'tab.all': 'Semua',
    'tab.new_arrivals': 'Terbaru',
    'tab.abayas': 'Abaya',
    'tab.kaftans': 'Kaftan',
    'tab.scarves': 'Hijab & Selendang',
    'tab.materials': 'Material Serat',

    // Home - Spotlight
    'spotlight.sig_badge': 'Koleksi Utama',
    'spotlight.sig_title': 'Abaya & Kaftan',
    'spotlight.wrap_badge': 'Drapery Penuh Makna',
    'spotlight.wrap_title': 'Sutra & Selendang',

    // Home - Product Grid
    'grid.tag': 'Kurasi Pilihan',
    'grid.title': 'Koleksi Paling Dicintai',
    'grid.view_all': 'Lihat Semua',

    // Home - Narrative
    'narrative.elegance_title': 'Keanggunan dalam Kesederhanaan',
    'narrative.elegance_p': 'Di SEVAYA, kami percaya keindahan sejati terpancar dari potongan busana yang abadi. Kami menciptakan busana modest yang menggabungkan kenyamanan, keleluasaan bergerak, dan keanggunan bersahaja.',
    'narrative.less_more': 'Sederhana, namun lebih bermakna',
    'narrative.read_more': 'Read more',
    'narrative.about_sub': 'TENTANG SEVAYA',
    'narrative.about_title': 'Cara Berbusana yang Lebih Lembut.',
    'narrative.about_p': 'SEVAYA lahir dari kecintaan akan desain abadi, keindahan berbusana modest, serta keyakinan bahwa pakaian dapat menjadi indah sekaligus bermakna. Terinspirasi dari warisan arsitektur Andalusia, SEVAYA menghadirkan keanggunan bersahaja dan kesederhanaan yang menenangkan.',

    // Home - Poetic
    'poetic.quote': '“Kamu tidak harus terburu-buru memahami segalanya. Masih ada waktu bagi semua hal indah untuk mekar di dalam dirimu.”',
    'poetic.source': 'Dari Buku Catatan Rhapsody • Bab III',

    // Home - Journal
    'journal.badge': 'JURNAL BERGENGSI',
    'journal.title': 'SUDUT BACA KAMI',
    'journal.explore': 'Lihat Semua Cerita',
    'journal.read_article': 'Read more',

    // Home - Newsletter
    'newsletter.title': 'Bergabung Bersama Komunitas Kami',
    'newsletter.desc': 'Dapatkan akses awal eksklusif untuk rilisan musim baru, koleksi kapsul terbatas, serta renungan jurnal atelier.',
    'newsletter.placeholder': 'Masukkan alamat email Anda...',
    'newsletter.cta': 'Berlangganan',

    // Bag & Cart
    'bag.continue': 'Lanjutkan Belanja',
    'bag.title_empty': 'Tas Belanja Anda Kosong',
    'bag.desc_empty': 'Jelajahi koleksi kami dan temukan siluet anggun untuk kenyamanan Anda.',
    'bag.discover': 'Jelajahi Koleksi',
    'bag.domestic_delivery': 'Pengiriman Domestik',
    'bag.unlocked': 'TERCAPAI',
    'bag.free_express': 'Gratis Kurir Kilat',
    'bag.unlocked_shipping': 'Anda mendapatkan Gratis Pengiriman Kilat Domestik!',
    'bag.add_more': 'Tambahkan',
    'bag.to_unlock': 'lagi untuk membuka',
    'bag.gift_packaging': 'Kemasan Hadiah Signature Atelier',
    'bag.complimentary': 'Gratis',
    'bag.gift_desc': 'Termasuk kotak linen keepsake murni, segel lilin organik, dan kartu ucapan kaligrafi personal.',
    'bag.calligraphy_note': 'Pesan Kaligrafi Pribadi',
    'bag.promo_placeholder': 'Masukkan Kode Promo Privilege',
    'bag.apply': 'Terapkan',
    'bag.applied': 'Diterapkan',
    'bag.order_summary': 'Ringkasan Pesanan',
    'bag.subtotal': 'Subtotal',
    'bag.total': 'Total Pembayaran',
    'bag.tax_included': 'Termasuk pajak domestik',
    'bag.returns_badge': 'Garansi Retur 14 Hari',
    'bag.checkout_btn': 'Lanjut ke Pembayaran Aman',
    'bag.gateways': 'Metode Pembayaran Resmi',

    // Profile & Orders
    'profile.tab_orders': 'Pesanan',
    'profile.tab_profile': 'Profil',
    'profile.welcome': 'Selamat datang',
    'profile.ready_to_shop': 'Siap berbelanja?',
    'profile.shop_now': 'Belanja sekarang',
    'profile.no_orders': 'Belum Ada Pesanan',
    'profile.no_orders_sub': 'Riwayat pesanan Anda akan muncul di sini setelah Anda menyelesaikan pembelian.',
    'profile.explore': 'Jelajahi Koleksi',
    'profile.total_bill': 'Total Tagihan',
    'profile.items_count': 'barang',
    'profile.more_items': 'produk lainnya dalam pesanan ini',
    'profile.order_details': 'Detail Pesanan',
    'profile.status_pending': 'Menunggu Pembayaran',
    'profile.status_processing': 'Sedang Dipersiapkan',
    'profile.status_shipped': 'Dalam Pengiriman',
    'profile.status_delivered': 'Pesanan Selesai',
    'profile.status_cancelled': 'Dibatalkan',
    'profile.personal_info': 'Informasi Profil',
    'profile.full_name': 'Nama Lengkap',
    'profile.phone': 'Nomor WhatsApp',
    'profile.save_changes': 'Simpan Perubahan',
    'profile.saved_addresses': 'Daftar Alamat',
    'profile.add_address': 'Tambah Alamat',
    'profile.no_addresses': 'Belum ada alamat tersimpan',
    'profile.default': 'Utama',
    'profile.set_default': 'Jadikan Utama',
    'profile.edit': 'Ubah',
    'profile.delete': 'Hapus',
    'profile.security': 'Keamanan',
    'profile.password': 'Kata Sandi',
    'profile.encrypted': 'Terenkripsi',
    'profile.change': 'Ubah',
    'profile.marketing_pref': 'Preferensi Pemasaran',
    'profile.language_pref': 'Bahasa',
    'profile.sign_out': 'Keluar Akun',
    'profile.sign_out_all': 'Keluar dari semua perangkat',

    // Footer
    'footer.contact_us': 'Hubungi Kami',
    'footer.customers': 'Layanan Pelanggan',
    'footer.company': 'Tentang Kami',
    'footer.terms': 'Syarat & Ketentuan',
    'footer.return_policy': 'Kebijakan Pengembalian',
    'footer.faq': 'Pertanyaan Umum (FAQ)',
    'footer.shipping_info': 'Informasi Pengiriman',
    'footer.shop_all': 'Semua Koleksi',
    'footer.news': 'Jurnal & Berita',
    'footer.lookbook': 'Lookbook',
    'footer.about_us': 'Tentang SEVAYA',
    'footer.newsletter_title': 'Dapatkan Cerita Terbaru Kami',
    'footer.newsletter_sub': 'Dengan mendaftar, Anda menyetujui Kebijakan Privasi dan Ketentuan Layanan kami.',
    'footer.subscribe': 'Berlangganan',
    'footer.subscribed': 'Terdaftar ✓',
    'footer.rights': 'Hak cipta dilindungi undang-undang.',
  },
  en: {
    // Top Bar & Header
    'announcement.shipping': 'Complimentary Shipping on Orders Above Rp 2.000.000',
    'announcement.subsidy': '(max subsidy 50k)',
    'nav.home': 'Home',
    'nav.collection': 'Collection',
    'nav.featured': 'Featured Abaya',
    'nav.lookbook': 'Lookbook',
    'nav.shop': 'Shop',
    'nav.about': 'About',
    'nav.news': 'News',
    'nav.bag': 'Bag',
    'nav.search_placeholder': 'Search silhouettes, fabrics, Bemberg, abayas...',
    'nav.trending': 'Trending Searches',

    // Drawer
    'drawer.sign_in': 'Sign In / Register',
    'drawer.sign_in_sub': 'Unlock atelier privileges & saved silhouettes',
    'drawer.sign_out': 'Sign Out',
    'drawer.categories': 'Shop by Category',
    'drawer.collections': 'Collections & Lookbook',
    'drawer.care': 'Concierge & Care',
    'drawer.all_silhouettes': 'All Silhouettes',
    'drawer.abayas_kaftans': 'Abayas & Kaftans',
    'drawer.outerwear': 'Modest Outerwear & Kimonos',
    'drawer.inner_slips': 'Essential Inner Slips',
    'drawer.scarves': 'Silk Hijabs & Scarves',
    'drawer.accessories': 'Sevaya Accessories',
    'drawer.vip_styling': 'WhatsApp VIP Styling Concierge',
    'drawer.shipping_returns': 'Shipping, Exchange & Returns',

    // Home - Countdown
    'home.countdown_ends': 'Capsule Drop Ends:',
    'home.days': 'd',
    'home.hours': 'h',
    'home.minutes': 'm',
    'home.seconds': 's',

    // Home - Hero
    'hero.badge': 'New Drop • Chapter III',
    'hero.title': '26° Rhapsody',
    'hero.desc': 'Free-flowing, expressive, and quietly harmonious silhouettes created for tropical serenity.',
    'hero.tagline': 'TIMELESS • INTENTIONAL • EFFORTLESS',
    'hero.cta_lookbook': 'Lookbook',
    'hero.cta_shop': 'Shop The Collection',

    // Home - Category Tabs
    'tab.all': 'All',
    'tab.new_arrivals': 'New Arrivals',
    'tab.abayas': 'Abayas',
    'tab.kaftans': 'Kaftans',
    'tab.scarves': 'Scarves',
    'tab.materials': 'Materials',

    // Home - Spotlight
    'spotlight.sig_badge': 'Signature Collection',
    'spotlight.sig_title': 'Abayas & Kaftans',
    'spotlight.wrap_badge': 'Mindful Draping',
    'spotlight.wrap_title': 'Silks & Scarves',

    // Home - Product Grid
    'grid.tag': 'SHOP THE COLLECTION',
    'grid.title': 'BEST-LOVED COLLECTIONS',
    'grid.view_all': 'View All',

    // Home - Narrative
    'narrative.elegance_title': 'Elegance in Simplicity',
    'narrative.elegance_p': 'At SEVAYA, we believe the most beautiful pieces are often the ones we return to, again and again. We create thoughtfully designed modestwear that brings together comfort, versatility, and understated elegance, pieces to accompany you through everyday moments and the occasions that matter.',
    'narrative.less_more': 'Less, but more meaningful',
    'narrative.read_more': 'Read more',
    'narrative.about_sub': 'ABOUT SEVAYA',
    'narrative.about_title': 'A Softer Way of Dressing.',
    'narrative.about_p': 'SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that what we wear can be both beautiful and meaningful. Inspired by the architectural heritage of Andalusia, SEVAYA brings together understated elegance and quiet simplicity.',

    // Home - Poetic
    'poetic.quote': '“You’re allowed to still be figuring things out. There is still time for you to bloom all the beautiful things growing within yourself.”',
    'poetic.source': 'From the Rhapsody Notebook • Chapter III',

    // Home - Journal
    'journal.badge': 'PRESTIGIOUS JOURNALS',
    'journal.title': 'OUR READING CORNER',
    'journal.explore': 'Explore All Stories',
    'journal.read_article': 'Read more',

    // Home - Newsletter
    'newsletter.title': 'Join Our Community',
    'newsletter.desc': 'Subscribe to our newsletter to receive early access to new seasonal drops, private capsule releases, and journal reflections.',
    'newsletter.placeholder': 'Enter your email address...',
    'newsletter.cta': 'Subscribe',

    // Bag & Cart
    'bag.continue': 'Continue Shopping',
    'bag.title_empty': 'Your Bag is Empty',
    'bag.desc_empty': 'Explore our curated collection and find silhouettes crafted for serene living.',
    'bag.discover': 'Discover Collections',
    'bag.domestic_delivery': 'Domestic Delivery',
    'bag.unlocked': 'UNLOCKED',
    'bag.free_express': 'Free Express Courier',
    'bag.unlocked_shipping': 'You have unlocked Free Domestic Express Shipping!',
    'bag.add_more': 'Add',
    'bag.to_unlock': 'more to unlock',
    'bag.gift_packaging': 'Signature Atelier Gift Packaging',
    'bag.complimentary': 'Complimentary',
    'bag.gift_desc': 'Includes unbleached linen keepsake box, organic wax seal, and a personalized hand-calligraphed note card.',
    'bag.calligraphy_note': 'Personalized Calligraphy Note',
    'bag.promo_placeholder': 'Enter Privilege Promo Code',
    'bag.apply': 'Apply',
    'bag.applied': 'Applied',
    'bag.order_summary': 'Order Summary',
    'bag.subtotal': 'Subtotal',
    'bag.total': 'Total Payable',
    'bag.tax_included': 'Includes domestic taxes',
    'bag.returns_badge': '14-Day Conscious Returns',
    'bag.checkout_btn': 'Proceed to Secure Checkout',
    'bag.gateways': 'Indonesian Gateways',

    // Profile & Orders
    'profile.tab_orders': 'Orders',
    'profile.tab_profile': 'Profile',
    'profile.welcome': 'Welcome',
    'profile.ready_to_shop': 'Ready to shop?',
    'profile.shop_now': 'Shop now',
    'profile.no_orders': 'No Orders Yet',
    'profile.no_orders_sub': 'Your order history will appear here once you make a purchase.',
    'profile.explore': 'Explore Collection',
    'profile.total_bill': 'Total Amount',
    'profile.items_count': 'items',
    'profile.more_items': 'more items in this order',
    'profile.order_details': 'Order Details',
    'profile.status_pending': 'Pending Payment',
    'profile.status_processing': 'In Preparation',
    'profile.status_shipped': 'In Transit',
    'profile.status_delivered': 'Completed',
    'profile.status_cancelled': 'Cancelled',
    'profile.personal_info': 'Profile Information',
    'profile.full_name': 'Full Name',
    'profile.phone': 'WhatsApp Number',
    'profile.save_changes': 'Save Changes',
    'profile.saved_addresses': 'Saved Addresses',
    'profile.add_address': 'Add Address',
    'profile.no_addresses': 'No saved addresses yet',
    'profile.default': 'Default',
    'profile.set_default': 'Set as Default',
    'profile.edit': 'Edit',
    'profile.delete': 'Delete',
    'profile.security': 'Security',
    'profile.password': 'Password',
    'profile.encrypted': 'Encrypted',
    'profile.change': 'Change',
    'profile.marketing_pref': 'Marketing Preferences',
    'profile.language_pref': 'Language',
    'profile.sign_out': 'Sign Out',
    'profile.sign_out_all': 'Sign out of all devices',

    // Footer
    'footer.contact_us': 'Contact Us',
    'footer.customers': 'Customers',
    'footer.company': 'Company',
    'footer.terms': 'Terms of Service',
    'footer.return_policy': 'Return Policy',
    'footer.faq': 'FAQ',
    'footer.shipping_info': 'Shipping Information',
    'footer.shop_all': 'Shop All Collections',
    'footer.news': 'News & Journals',
    'footer.lookbook': 'Lookbook',
    'footer.about_us': 'About Us',
    'footer.newsletter_title': 'Get the latest news from us',
    'footer.newsletter_sub': 'By signing up, you agree to our Privacy Policy and Terms of Service.',
    'footer.subscribe': 'Subscribe',
    'footer.subscribed': 'Subscribed ✓',
    'footer.rights': 'All rights reserved.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sevaya_lang') as Language | null;
      if (saved === 'id' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sevaya_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
