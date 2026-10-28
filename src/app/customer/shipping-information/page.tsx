import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Shipping Information — SEVAYA',
};

export default function ShippingInformationPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6 sm:pt-22 lg:px-8">

        {/* Header */}
        <header className="mb-5 border-b border-black/10 pb-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">Help</span>
          <h1 className="mt-2 font-sans text-lg font-normal tracking-wide text-[#000000] sm:text-xl">
            Shipping Information
          </h1>
        </header>

        {/* Content */}
        <div className="space-y-5 text-[11px] leading-relaxed text-[#333333]">
          <p>
            Every SEVAYA piece is prepared with care, from the finishing details to the moment it reaches your hands.
          </p>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Order Processing</h2>
            <p>
              Orders are processed after payment has been confirmed. Processing times may vary depending on product availability, order volume, and whether an item is ready stock or pre-order.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Delivery Times</h2>
            <p>
              Estimated delivery times depend on your destination and selected courier service. Delivery timelines are estimates and may be affected by public holidays, weather conditions, or circumstances beyond our control.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Shipping Fees</h2>
            <p>
              Shipping fees are calculated based on your delivery address, package weight, and the courier service selected at checkout.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Order Tracking</h2>
            <p>
              Once your order has been shipped, tracking information will be provided when available so you can follow its journey.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Delivery Issues</h2>
            <p>
              If your package is delayed, arrives damaged, or appears to be lost, please contact us with your order details so we can assist you.
            </p>
          </section>

          <p className="border-t border-black/10 pt-6 text-[10px] text-[#666666] italic">
            We appreciate your patience and trust as your SEVAYA pieces make their way to you.
          </p>

          <p className="text-[11px] text-[#333333]">
            For shipping enquiries, please contact us via WhatsApp at{' '}
            <a
              href="https://wa.me/6285190993087"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-black pb-0.5 font-medium hover:text-black/60 transition-colors"
            >
              0851-9099-3087
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
