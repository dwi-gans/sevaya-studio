import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Returns & Exchanges — SEVAYA',
};

export default function ReturnsExchangesPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6 sm:pt-22 lg:px-8">

        {/* Header */}
        <header className="mb-5 border-b border-black/10 pb-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">Help</span>
          <h1 className="mt-2 font-sans text-lg font-normal tracking-wide text-[#000000] sm:text-xl">
            Returns &amp; Exchanges
          </h1>
        </header>

        {/* Content */}
        <div className="space-y-5 text-[11px] leading-relaxed text-[#333333]">
          <p>
            At SEVAYA, we take care in creating each piece and want you to feel confident in your purchase.
          </p>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Eligibility</h2>
            <p>
              If you receive an incorrect, defective, or damaged item, please contact us within 2 × 24 hours of receiving your order. Include your order number, a description of the issue, and clear photos or videos of the item and its packaging.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Conditions</h2>
            <p>
              To be eligible for a return or exchange, items must be unworn, unwashed, unaltered, and returned with their original tags and packaging. Items showing signs of use, damage caused after delivery, or alterations may not qualify.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Non-Returnable Items</h2>
            <p>
              For hygiene and product-care reasons, certain items, including hijabs, may not be eligible for return or exchange unless they arrive defective or incorrect.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">How to Request a Return or Exchange</h2>
            <ol className="space-y-2 list-none">
              {[
                <>Contact our customer service via WhatsApp at{' '}<a href="https://wa.me/6285190993087" target="_blank" rel="noopener noreferrer" className="border-b border-black pb-0.5 font-medium hover:text-black/60 transition-colors">0851-9099-3087</a>.</>,
                'Provide your order number and supporting photos or videos.',
                'Wait for our team to review your request and provide further instructions.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-black/20 text-[9px] font-semibold text-[#666666]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-[10px] text-[#666666] italic">
              Please do not send items back before receiving confirmation from our team.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">Refunds &amp; Shipping Costs</h2>
            <p>
              Approved refunds or exchanges will be handled according to the circumstances of the case and applicable consumer protection laws. Responsibility for return shipping costs will be communicated during the review process.
            </p>
          </section>

          <p className="border-t border-black/10 pt-6 text-[10px] text-[#666666] italic">
            We appreciate your understanding and the care you give to every SEVAYA piece.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
