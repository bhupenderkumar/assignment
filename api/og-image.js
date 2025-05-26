// api/og-image.js - Dynamic Open Graph Image Generation
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters from URL
    const title = searchParams.get('title') || 'Interactive Assignment';
    const organization = searchParams.get('organization') || 'First Step School';
    const description = searchParams.get('description') || 'Complete exercises, get instant feedback, and earn your certificate!';
    const logoUrl = searchParams.get('logo');
    const primaryColor = searchParams.get('primaryColor') || '#10b981';
    const secondaryColor = searchParams.get('secondaryColor') || '#8b5cf6';

    // Create the image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 25% 25%, ${primaryColor}20 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${secondaryColor}20 0%, transparent 50%)`,
            }}
          />
          
          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              textAlign: 'center',
              maxWidth: '900px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo */}
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Organization Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  marginBottom: '24px',
                  border: `3px solid ${primaryColor}`,
                }}
              />
            )}
            
            {/* Organization Name */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: '600',
                color: primaryColor,
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}
            >
              {organization}
            </div>
            
            {/* Assignment Title */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#1f2937',
                marginBottom: '24px',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: '24px',
                color: '#6b7280',
                marginBottom: '32px',
                lineHeight: '1.4',
                maxWidth: '700px',
              }}
            >
              {description}
            </div>
            
            {/* Call to Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: primaryColor,
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: '600',
                boxShadow: `0 8px 32px ${primaryColor}40`,
              }}
            >
              🎓 Take Assignment
            </div>
          </div>
          
          {/* Bottom Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              color: '#9ca3af',
              fontWeight: '500',
            }}
          >
            ✨ Powered by First Step School
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
