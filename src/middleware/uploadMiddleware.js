const multer = require('multer');

// Store uploaded files in memory buffer before sending to Cloudinary
const storage = multer.memoryStorage();

// File size limits in bytes
const SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,     // 10 MB for photos / avatars
  DOCUMENT: 25 * 1024 * 1024,  // 25 MB for PDFs & project briefs
  ARCHIVE: 50 * 1024 * 1024,   // 50 MB for ZIP files & code archives
  VIDEO: 50 * 1024 * 1024     // 50 MB for media / videos
};

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain',
  // Archives & Code Bundles
  'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'application/octet-stream',
  'application/x-rar-compressed', 'application/vnd.rar', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
  // Videos / Audio
  'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp3'
];

const fileFilter = (req, file, cb) => {
  const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
  const isArchiveExt = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
  
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || isArchiveExt) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not supported. Please upload an image, document (PDF, DOCX), video, or ZIP code archive.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: SIZE_LIMITS.VIDEO // Global upper limit set to 50MB
  }
});

// Fine-grained size validation middleware
const validateFileSize = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const filesToCheck = req.files || [req.file];

  for (const file of filesToCheck) {
    if (!file) continue;
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
    const isArchive = file.mimetype.includes('zip') || file.mimetype.includes('compressed') || file.mimetype.includes('tar') || /\.(zip|rar|7z|tar|gz)$/i.test(file.originalname);
    const isDocument = !isArchive && (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text'));

    if (isImage && file.size > SIZE_LIMITS.IMAGE) {
      return res.status(400).json({ 
        message: `Image '${file.originalname}' exceeds the 10 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).` 
      });
    }

    if (isArchive && file.size > SIZE_LIMITS.ARCHIVE) {
      return res.status(400).json({ 
        message: `ZIP archive '${file.originalname}' exceeds the 50 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).` 
      });
    }

    if (isDocument && file.size > SIZE_LIMITS.DOCUMENT) {
      return res.status(400).json({ 
        message: `Document '${file.originalname}' exceeds the 25 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).` 
      });
    }

    if (isVideo && file.size > SIZE_LIMITS.VIDEO) {
      return res.status(400).json({ 
        message: `Video '${file.originalname}' exceeds the 50 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).` 
      });
    }
  }

  next();
};

module.exports = {
  upload,
  validateFileSize,
  SIZE_LIMITS
};
