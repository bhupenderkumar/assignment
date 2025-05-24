// api/og-meta.js - Vercel serverless function for dynamic meta tags
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
    const { assignmentId } = req.query;

    if (!assignmentId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assignment data
    const { data: assignment, error: assignmentError } = await supabase
      .from('interactive_assignment')
      .select(`
        id,
        title,
        description,
        organization_id,
        organization:organization_id (
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const organization = assignment.organization;
    const baseUrl = 'https://interactive-assignment-one.vercel.app';
    const assignmentUrl = `${baseUrl}/play/assignment/${assignmentId}`;

    // Generate meta tags
    const metaTags = {
      title: organization?.name 
        ? `${organization.name} | ${assignment.title}`
        : `${assignment.title} | Interactive Assignment`,
      description: assignment.description || 
        `Take the interactive assignment "${assignment.title}" ${organization?.name ? `from ${organization.name}` : ''}`,
      url: assignmentUrl,
      siteName: organization?.name || 'Interactive Assignments',
      image: organization?.logo_url || `${baseUrl}/og-image.png`,
      imageAlt: `${assignment.title} - Interactive Assignment`,
      type: 'website'
    };

    // Return meta tags as JSON
    res.status(200).json({
      success: true,
      metaTags,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        organization: organization ? {
          name: organization.name,
          logoUrl: organization.logo_url
        } : null
      }
    });

  } catch (error) {
    console.error('Error generating meta tags:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
