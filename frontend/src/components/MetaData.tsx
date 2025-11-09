import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaDataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  twitterCreator?: string;
  twitterSite?: string;
}

export const MetaData: React.FC<MetaDataProps> = ({
  title = "El_Dera's writes - Curating thoughtful perspectives",
  description = "El_Dera's writes is a blog curating thoughtful perspectives on technology, design, and the art of mindful living.",
  image = "https://el-deras-writes.vercel.app/logo512.webp", // Replace with your actual default logo URL
  url = "https://el-deras-writes.vercel.app/", // Replace with your actual base URL
  siteName = "El_Dera's writes",
  locale = "en_US",
  twitterCreator = "@el_deras_writes", // Replace with your Twitter handle
  twitterSite = "@el_deras_writes", // Replace with your Twitter handle
}) => {
  return (
    <Helmet>
      {/* Standard meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content={twitterCreator} />
      <meta property="twitter:site" content={twitterSite} />
    </Helmet>
  );
};
