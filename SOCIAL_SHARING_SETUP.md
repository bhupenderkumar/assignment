# 🎯 WhatsApp-Style Social Media Sharing Setup

This guide explains how to set up WhatsApp-style link previews with images and titles for your Interactive Assignments platform.

## 🚀 What's Implemented

### ✅ Server-Side Open Graph Generation
- **Dynamic meta tags** generated server-side for social media crawlers
- **Assignment-specific previews** with title, description, and organization logo
- **Shareable link support** for both direct assignment links and shareable links

### ✅ Enhanced Sharing Component
- **ShareButton component** with multiple sharing options
- **Social media integration** (WhatsApp, Facebook, Twitter, LinkedIn)
- **Copy to clipboard** functionality
- **Native Web Share API** support for mobile devices

### ✅ Default Open Graph Image
- **Professional default image** for assignments without organization logos
- **SVG and PNG versions** for maximum compatibility
- **1200x630 dimensions** optimized for all social platforms

## 📋 Setup Instructions

### 1. Create the Default Open Graph Image

1. **Visit the converter page**: Go to `https://your-domain.com/convert-svg-to-png.html`
2. **Load the SVG**: Click "Load SVG" to preview the default image
3. **Download PNG**: Click "Download PNG" to get the `og-default.png` file
4. **Replace the file**: Upload the downloaded PNG to your `public` folder

### 2. Test the Social Sharing

#### For Assignment Links:
```
Social Share URL: https://your-domain.com/og/assignment/ASSIGNMENT_ID
Direct URL: https://your-domain.com/play/assignment/ASSIGNMENT_ID
```

#### For Shareable Links:
```
Social Share URL: https://your-domain.com/og/share/SHAREABLE_LINK
Direct URL: https://your-domain.com/play/share/SHAREABLE_LINK
```

### 3. Use the ShareButton Component

```tsx
import ShareButton from '../components/sharing/ShareButton';

// For assignment sharing
<ShareButton 
  type="assignment" 
  id="your-assignment-id"
  title="Math Quiz - Grade 1"
  description="Complete this interactive math quiz and earn your certificate!"
/>

// For shareable link sharing
<ShareButton 
  type="share" 
  id="abc123-assignment-id"
  title="Shared Assignment"
  description="Join this assignment shared with you!"
/>
```

## 🔧 How It Works

### 1. Social Media Crawler Detection
When WhatsApp, Facebook, or other social media platforms crawl your links:

1. **Crawler hits**: `https://your-domain.com/og/assignment/ASSIGNMENT_ID`
2. **Server generates**: Dynamic HTML with proper Open Graph meta tags
3. **Crawler reads**: Title, description, image, and other meta data
4. **User redirected**: To the actual assignment page after meta tags are read

### 2. URL Structure

#### Social Share URLs (for previews):
- `https://your-domain.com/og/assignment/{assignmentId}`
- `https://your-domain.com/og/share/{shareableLink}`

#### Direct URLs (for navigation):
- `https://your-domain.com/play/assignment/{assignmentId}`
- `https://your-domain.com/play/share/{shareableLink}`

### 3. Meta Tag Generation

The server-side function fetches:
- **Assignment data** (title, description)
- **Organization data** (name, logo, colors)
- **Generates meta tags** with proper Open Graph format
- **Returns HTML** with meta tags and redirect

## 🧪 Testing Your Setup

### 1. Facebook Sharing Debugger
- Visit: https://developers.facebook.com/tools/debug/
- Enter your OG URL: `https://your-domain.com/og/assignment/YOUR_ID`
- Check if title, description, and image appear correctly

### 2. Twitter Card Validator
- Visit: https://cards-dev.twitter.com/validator
- Enter your OG URL and validate the card preview

### 3. WhatsApp Test
- Send the OG URL to yourself on WhatsApp
- Check if the preview shows title, description, and image

### 4. LinkedIn Post Inspector
- Visit: https://www.linkedin.com/post-inspector/
- Test your OG URL for LinkedIn sharing

## 📱 Mobile Sharing Features

### Native Web Share API
On mobile devices, the ShareButton automatically uses the native sharing menu when available.

### WhatsApp Integration
Direct WhatsApp sharing with pre-filled message and proper link preview.

### Copy to Clipboard
Fallback option that works on all devices and browsers.

## 🎨 Customization

### Custom Open Graph Images
1. **Organization logos** are automatically used when available
2. **Default image** can be customized by replacing `og-default.png`
3. **Dynamic images** can be generated using the Vercel OG Image API

### Custom Meta Tags
Modify the `api/og/[...params].js` file to customize:
- Title format
- Description template
- Additional meta tags
- Image selection logic

## 🚨 Troubleshooting

### Link Previews Not Showing
1. **Check the OG URL**: Make sure `https://your-domain.com/og/assignment/ID` returns proper HTML
2. **Verify meta tags**: View page source to confirm Open Graph tags are present
3. **Clear cache**: Use Facebook Debugger to clear social media cache
4. **Check image**: Ensure the image URL is accessible and properly sized

### Images Not Loading
1. **Check image URL**: Verify the organization logo or default image is accessible
2. **Image format**: Use PNG or JPG (avoid SVG for better compatibility)
3. **Image size**: Ensure images are at least 1200x630 pixels
4. **HTTPS**: Make sure all image URLs use HTTPS

### Redirects Not Working
1. **Check JavaScript**: Ensure the redirect script is working
2. **Meta refresh**: The HTML includes a meta refresh as fallback
3. **Server response**: Verify the API returns proper HTML content

## 🎯 Best Practices

### 1. Image Optimization
- **Size**: 1200x630 pixels (Facebook recommended)
- **Format**: PNG or JPG
- **File size**: Keep under 1MB for faster loading
- **Content**: Include text overlay for better engagement

### 2. Title and Description
- **Title**: Keep under 60 characters
- **Description**: Keep under 160 characters
- **Keywords**: Include relevant educational keywords
- **Call to action**: Encourage users to take the assignment

### 3. Testing
- **Test regularly**: Check previews after making changes
- **Multiple platforms**: Test on WhatsApp, Facebook, Twitter, LinkedIn
- **Mobile and desktop**: Verify previews work on both
- **Cache clearing**: Clear social media cache when updating

## 🔗 Useful Links

- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

Now your Interactive Assignments platform will show beautiful previews with images and titles when shared on WhatsApp, Facebook, Twitter, and other social media platforms! 🎉
