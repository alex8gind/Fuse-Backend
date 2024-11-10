const cloudinary = require('cloudinary').v2;

// utils/generateSignedUrl.js

const generateSignedUrl = async (document) => {
  if (!document?.url) {
    throw new Error('Invalid document URL');
  }

  try {
    // Extract the public ID from the Cloudinary URL
    const urlParts = document.url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = `user_documents/${fileName.split('.')[0]}`;

    const isPDF = document.fileType.toLowerCase() === 'pdf';

    // Generate signed URL with different options based on file type
    const signedUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: isPDF ? 'raw' : 'image', // Use 'raw' for PDFs, 'image' for images
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      ...(isPDF ? {} : {
        // Add image-specific transformations if needed
        format: document.fileType.toLowerCase(),
        quality: 'auto',
        fetch_format: 'auto'
      })
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate document access URL');
  }
};

module.exports = {
  generateSignedUrl
};