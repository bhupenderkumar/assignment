// api/og/[...params].js - Dynamic Open Graph meta tags for social sharing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { params } = req.query;

    if (!params || params.length === 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const [type, id] = params;

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    let assignment = null;
    let organization = null;

    // Handle different types of requests
    if (type === 'assignment') {
      // Fetch assignment data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('interactive_assignment')
        .select(`
          id,
          title,
          description,
          organization_id,
          created_at,
          organization:organization_id (
            name,
            logo_url,
            primary_color,
            secondary_color,
            header_text
          )
        `)
        .eq('id', id)
        .single();

      if (assignmentError || !assignmentData) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      assignment = assignmentData;
      organization = assignmentData.organization;
    } else if (type === 'share') {
      // Handle shareable link
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('interactive_assignment')
        .select(`
          id,
          title,
          description,
          organization_id,
          created_at,
          organization:organization_id (
            name,
            logo_url,
            primary_color,
            secondary_color,
            header_text
          )
        `)
        .eq('shareable_link', id)
        .single();

      if (assignmentError || !assignmentData) {
        return res.status(404).json({ error: 'Shared assignment not found' });
      }

      assignment = assignmentData;
      organization = assignmentData.organization;
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "assignment" or "share"' });
    }

    const baseUrl = 'https://interactive-assignment-one.vercel.app';
    const assignmentUrl = type === 'assignment'
      ? `${baseUrl}/play/assignment/${assignment.id}`
      : `${baseUrl}/play/share/${id}`;

    // Generate comprehensive meta tags
    const title = organization?.name
      ? `${organization.name} | ${assignment.title}`
      : `${assignment.title} | Interactive Assignment`;

    const description = assignment.description ||
      `Take the interactive assignment "${assignment.title}" ${organization?.name ? `from ${organization.name}` : ''}. Complete exercises, get instant feedback, and earn your certificate!`;

    const image = organization?.logo_url || `${baseUrl}/og-default.png`;
    const siteName = organization?.name || 'First Step School';

    // Generate HTML with meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Basic Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph Meta Tags for Facebook, WhatsApp, etc. -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${assignmentUrl}">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${assignment.title} - Interactive Assignment">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:image:alt" content="${assignment.title} - Interactive Assignment">

    <!-- Additional Meta Tags -->
    <meta name="author" content="${siteName}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${assignmentUrl}">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="${organization?.logo_url || '/vite.svg'}">

    <!-- Redirect to actual page -->
    <script>
        window.location.href = "${assignmentUrl}";
    </script>
    <meta http-equiv="refresh" content="0; url=${assignmentUrl}">
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>${title}</h1>
        <p>${description}</p>
        <p>If you are not redirected automatically, <a href="${assignmentUrl}">click here</a>.</p>
    </div>
</body>
</html>`;

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error generating OG page:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
