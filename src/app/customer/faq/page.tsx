import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'FAQ — SEVAYA',
};

const faqs = [
  {
    q: 'What is SEVAYA?',
    a: 'SEVAYA is a modestwear brand inspired by timeless design, intentional living, and effortless elegance. We create thoughtfully designed pieces for women who wish to embrace modesty while moving confidently through every part of life.',
  },
  {
    q: 'What sizes are available?',
    a: 'Each product has its own size guide with measurements to help you find your preferred fit. We recommend checking the measurements on the individual product page before placing your order.',
  },
  {
    q: 'What materials does SEVAYA use?',
    a: 'We thoughtfully explore materials that balance comfort, beauty, and a more responsible approach to fashion. Our collections feature plant-based fibre fabrics such as cupro and viscose. Please refer to each product description for its specific fabric composition.',
  },
  {
    q: 'How should I care for my SEVAYA pieces?',
    a: 'Care instructions vary depending on the fabric. Please follow the care label attached to your garment to help maintain its shape, texture, and quality.',
  },
  {
    q: 'Do you accept returns or exchanges?',
    a: 'Returns and exchanges are subject to our Returns & Exchanges Policy. If your item arrives damaged, defective, or incorrect, please contact us as soon as possible via WhatsApp at 0851-9099-3087.',
  },
  {
    q: 'How long will my order take to arrive?',
    a: 'Delivery times depend on your location, courier service, and product availability. Please refer to our Shipping Information page for further details.',
  },
  {
    q: 'Do you offer pre-orders?',
    a: 'Selected products may be offered through a pre-order system. Availability, estimated production timelines, and payment terms will be communicated on the relevant product page or through our official sales channels.',
  },
  {
    q: 'How can I contact SEVAYA?',
    a: 'You can reach us through our official WhatsApp (0851-9099-3087) or Instagram account for product enquiries, sizing assistance, and order support.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6 sm:pt-22 lg:px-8">

        {/* Header */}
        <header className="mb-5 border-b border-black/10 pb-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">Help</span>
          <h1 className="mt-2 font-sans text-lg font-normal tracking-wide text-[#000000] sm:text-xl">
            Frequently Asked Questions
          </h1>
        </header>

        {/* FAQ List */}
        <div className="divide-y divide-black/8">
          {faqs.map((item, i) => (
            <div key={i} className="py-4 space-y-1.5">
              <h2 className="flex items-start gap-3">
                <span className="text-[10px] font-semibold tracking-[0.15em] text-[#999999] tabular-nums mt-0.5">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span className="text-[11px] font-semibold text-[#000000] leading-relaxed">
                  {item.q}
                </span>
              </h2>
              <p className="pl-7 text-[11px] leading-relaxed text-[#444444]">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-7 border-t border-black/10 pt-5 text-center">
          <p className="text-[11px] text-[#555555]">Still have questions? We would be happy to hear from you.</p>
          <a
            href="https://wa.me/6285190993087"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[10px] font-medium text-black border-b border-black pb-0.5 transition hover:text-black/60"
          >
            Contact us via WhatsApp →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
