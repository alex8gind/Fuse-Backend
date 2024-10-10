const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/user.model'); // Adjust the path as needed
const Document = require('../models/document.model');


// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_documents',
    allowed_formats: ['jpg', 'png', 'pdf'],
  },
});

// Local storage configuration
const localUploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir);
}

const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, localUploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.'));
    }
};

// Choose storage option based on environment variable
const useCloudinary = process.env.USE_CLOUDINARY === 'true';
const storage = useCloudinary ? cloudinaryStorage : localStorage;

// Initialize upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

const uploadFile = async (req, res) => {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
  
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
  
    const fileUrl = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    const userId = req.user.userId;
    const documentType = req.body.documentType;
  
    console.log('File URL:', fileUrl);
    console.log('User ID:', userId);
    console.log('Document Type:', documentType);
  
    if (!documentType) {
      console.log('Document type is missing');
      return res.status(400).json({ success: false, error: 'Document type is required' });
    }
  
    try {
      const user = await User.findOne({ userId: userId });
      if (!user) {
        console.log('User not found');
        if (!useCloudinary) {
          fs.unlinkSync(path.join(localUploadsDir, req.file.filename));
        }
        return res.status(404).json({ success: false, error: 'User not found' });
      }
  
      // Create new document
      const newDocument = new Document({
        type: documentType,
        url: fileUrl,
        userId: userId
      });
  
      const savedDocument = await newDocument.save();
      console.log('Document saved:', savedDocument);
  
      // Add the document reference to the user's documents array
      user.documents.push(savedDocument._id);
      await user.save();
    
      console.log('File saved successfully:', savedDocument);
    
      res.json({ 
      success: true,
      message: 'File uploaded and associated with user',
      fileUrl: fileUrl, 
      documentType: documentType,
      documentId: savedDocument._id
    });
  } catch (error) {
    console.error('Error in upload process:', error);
    res.status(500).json({ success: false, error: 'Error saving document information' });
  }
};
module.exports = {
    upload,
    uploadFile
};