import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service — SEVAYA',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6 sm:pt-22 lg:px-8">

        {/* Header */}
        <header className="mb-5 border-b border-black/10 pb-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">Help</span>
          <h1 className="mt-2 font-sans text-lg font-normal tracking-wide text-[#000000] sm:text-xl">
            Terms of Service
          </h1>
        </header>

        {/* Content */}
        <div className="space-y-5 text-[11px] leading-relaxed text-[#333333]">
          <p>
            Welcome to SEVAYA.<br />
            By accessing our website and placing an order, you agree to the following terms and conditions. Please read them carefully before making a purchase.
          </p>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Orders &amp; Payments</h2>
            <p>
              All orders are subject to product availability and payment confirmation. Prices are listed in Indonesian Rupiah (IDR). An order is considered confirmed once payment has been successfully received.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Product Information</h2>
            <p>
              We strive to present our products as accurately as possible. However, slight variations in colour may occur due to lighting, photography, or individual screen settings. As our garments are produced in limited quantities, availability may vary between collections.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Pricing &amp; Availability</h2>
            <p>
              SEVAYA reserves the right to update product prices, descriptions, and availability when necessary. Any changes will not affect orders that have already been confirmed, except where required by applicable law.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Intellectual Property</h2>
            <p>
              All content on this website, including photographs, designs, text, and visual elements, belongs to SEVAYA or its respective rights holders and may not be reproduced without prior permission.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Contact Us</h2>
            <p>
              For questions regarding these terms, please contact us through our official customer service channels.
            </p>
          </section>

          <p className="border-t border-black/10 pt-6 text-[10px] text-[#666666] italic">
            Thank you for choosing SEVAYA and being part of our journey toward more thoughtful fashion.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
