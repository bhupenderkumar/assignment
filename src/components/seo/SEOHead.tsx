// src/components/seo/SEOHead.tsx - Comprehensive SEO and Social Media Meta Tags Component
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  keywords?: string;
  noIndex?: boolean;
  canonical?: string;
  favicon?: string;
  twitterHandle?: string;
  locale?: string;
  additionalMetaTags?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  url = 'https://interactive-assignment-one.vercel.app',
  image = 'https://interactive-assignment-one.vercel.app/og-default.png',
  type = 'website',
  siteName = 'First Step School',
  author = 'First Step School',
  publishedTime,
  keywords,
  noIndex = false,
  canonical,
  favicon,
  twitterHandle = '@FirstStepSchool',
  locale = 'en_US',
  additionalMetaTags = []
}) => {
  const baseUrl = 'https://interactive-assignment-one.vercel.app';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
  const canonicalUrl = canonical || fullUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph Meta Tags for Facebook, WhatsApp, etc. */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={locale} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:secure_url" content={fullImageUrl} />

      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          <meta property="article:section" content="Education" />
          <meta property="article:tag" content="Interactive Assignment" />
          <meta property="article:tag" content="Education" />
          <meta property="article:tag" content="Learning" />
          {publishedTime && <meta property="og:updated_time" content={publishedTime} />}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:site" content={twitterHandle} />

      {/* Additional Meta Tags */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicon */}
      {favicon && <link rel="icon" type="image/png" href={favicon} />}

      {/* Additional custom meta tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta
          key={index}
          {...(tag.name ? { name: tag.name } : {})}
          {...(tag.property ? { property: tag.property } : {})}
          content={tag.content}
        />
      ))}

      {/* JSON-LD Structured Data for better SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebPage',
          "headline": title,
          "description": description,
          "url": fullUrl,
          "image": fullImageUrl,
          "author": {
            "@type": "Organization",
            "name": author
          },
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": fullImageUrl
            }
          },
          ...(publishedTime && { "datePublished": publishedTime }),
          ...(publishedTime && { "dateModified": publishedTime })
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
