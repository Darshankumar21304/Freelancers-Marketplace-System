const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');
const { User } = require('../models');

// Ensure local backup directory exists
const deliverablesDir = path.join(__dirname, '../../uploads/deliverables');
if (!fs.existsSync(deliverablesDir)) {
  fs.mkdirSync(deliverablesDir, { recursive: true });
}

// Helper to determine Cloudinary target folder & resource type
const getCloudinaryOptions = (file, customFolder = null) => {
  const mime = file.mimetype || '';
  let folder = customFolder || 'gigsphere/uploads';
  let resource_type = 'auto';

  const nameWithoutExt = file.originalname ? file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, '_') : 'deliverable';
  const originalExt = file.originalname && file.originalname.includes('.') ? file.originalname.split('.').pop().toLowerCase() : 'pdf';
  const isArchive = mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(originalExt);

  if (mime.startsWith('image/')) {
    folder = customFolder || 'gigsphere/images';
    resource_type = 'image';
  } else if (mime.startsWith('video/') || mime.startsWith('audio/')) {
    folder = customFolder || 'gigsphere/videos';
    resource_type = 'video';
  } else if (isArchive) {
    folder = customFolder || 'gigsphere/archives';
    resource_type = 'raw';
  } else {
    folder = customFolder || 'gigsphere/documents';
    resource_type = 'raw';
  }

  // PDF Workaround: Upload as .dat to bypass Cloudinary account-level PDF delivery restrictions
  const ext = originalExt === 'pdf' ? 'dat' : originalExt;
  const public_id = `${Date.now()}_${nameWithoutExt}.${ext}`;

  return { folder, resource_type, public_id };
};

// 1. Single File Upload to Cloudinary Global CDN (Accessible from any computer/mobile globally)
exports.uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided for upload' });
    }

    const { folder, resource_type, public_id } = getCloudinaryOptions(req.file);

    // Primary: Upload directly to Cloudinary Global CDN
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resource_type,
      public_id
    });

    const globalUrl = result.secure_url;

    // Secondary: Write local backup copy
    try {
      const ext = req.file.originalname && req.file.originalname.includes('.') ? req.file.originalname.split('.').pop() : 'pdf';
      const safeName = req.file.originalname ? req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, '_') : 'deliverable';
      const filename = `${Date.now()}_${safeName}.${ext}`;
      fs.writeFileSync(path.join(deliverablesDir, filename), req.file.buffer);
    } catch (e) {
      console.log('Local backup copy skipped:', e.message);
    }

    res.json({
      success: true,
      url: globalUrl,
      publicId: result.public_id,
      originalName: req.file.originalname,
      bytes: result.bytes || req.file.size,
      mimetype: req.file.mimetype,
      message: 'File uploaded to Cloudinary Global Cloud Storage successfully'
    });
  } catch (error) {
    console.error('Cloudinary Global Upload Error:', error);
    res.status(500).json({ message: error.message || 'Error uploading file to Cloudinary' });
  }
};

// 2. Multiple Files Upload to Cloudinary Global CDN
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided for upload' });
    }

    const uploadPromises = req.files.map(file => {
      const { folder, resource_type, public_id } = getCloudinaryOptions(file);
      return uploadToCloudinary(file.buffer, { folder, resource_type, public_id }).then(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
        bytes: result.bytes || file.size,
        mimetype: file.mimetype
      }));
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
      message: 'All files uploaded to Cloudinary Global Storage successfully'
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ message: error.message || 'Error uploading multiple files' });
  }
};

// 3. User Avatar Profile Photo Upload
exports.uploadAvatar = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ message: 'No image file provided for avatar update' });
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Avatar file must be an image (JPG, PNG, WEBP, GIF)' });
    }

    let avatarUrl = '';
    let publicId = null;

    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'gigsphere/avatars',
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
      });
      avatarUrl = result.secure_url;
      publicId = result.public_id;
    } catch (cloudinaryErr) {
      console.warn('Cloudinary avatar upload failed, using local file storage fallback:', cloudinaryErr.message);
      const avatarsDir = path.join(__dirname, '../../uploads/avatars');
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }
      const ext = file.originalname && file.originalname.includes('.') ? file.originalname.split('.').pop() : 'png';
      const filename = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      fs.writeFileSync(path.join(avatarsDir, filename), file.buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    if (req.user) {
      const userId = req.user.id || req.user._id || req.user.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, { avatar: avatarUrl, profilePhoto: avatarUrl });
      }
    }

    res.json({
      success: true,
      url: avatarUrl,
      avatarUrl: avatarUrl,
      publicId: publicId,
      message: 'Profile photo updated successfully!'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message || 'Error updating profile photo' });
  }
};

// 4. PDF Stream Proxy (Serves PDF with Content-Disposition: inline so browsers render it natively in-app)
exports.viewPdf = async (req, res) => {
  try {
    const fileUrl = req.query.url;
    if (!fileUrl) {
      return res.status(400).send('No file URL provided');
    }

    // Check if it's a local file
    if (fileUrl.startsWith('http://localhost:5001/uploads/') || fileUrl.startsWith('/uploads/')) {
      const relativePath = fileUrl.replace(/^https?:\/\/[^\/]+/, '').replace('/uploads/', '');
      const localFilePath = path.join(__dirname, '../../uploads', relativePath);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // Remote Cloudinary or HTTPS URL
    const https = require('https');
    const http = require('http');
    const client = fileUrl.startsWith('https') ? https : http;

    const streamRemote = (urlToFetch) => {
      client.get(urlToFetch, (remoteRes) => {
        if (remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
          return streamRemote(remoteRes.headers.location);
        }
        res.status(remoteRes.statusCode);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        remoteRes.pipe(res);
      }).on('error', (err) => {
        console.error('PDF proxy stream error:', err);
        res.status(500).send('Error streaming PDF: ' + err.message);
      });
    };

    streamRemote(fileUrl);
  } catch (error) {
    console.error('View PDF error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
};

