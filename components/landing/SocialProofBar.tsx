'use client';

export function SocialProofBar() {
  return (
    <section
      className="w-full py-7 border-y"
      style={{
        background: '#0E1420',
        borderColor: '#1E2D47',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-6" style={{ color: '#3D5278', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
          Built on reliable infrastructure you already trust
        </div>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-12 opacity-45">
          <div style={{ color: '#4F8EF7', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            Google Gemini
          </div>
          <div style={{ color: '#1E2D47' }}>|</div>

          <div style={{ color: '#A855F7', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            Cloudinary
          </div>
          <div style={{ color: '#1E2D47' }}>|</div>

          <div style={{ color: '#F0F4FF', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            Vercel
          </div>
          <div style={{ color: '#1E2D47' }}>|</div>

          <div style={{ color: '#7A90B8', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            Stripe
          </div>
          <div style={{ color: '#1E2D47' }}>|</div>

          <div style={{ color: '#7A90B8', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            Clerk
          </div>
        </div>
      </div>
    </section>
  );
}
