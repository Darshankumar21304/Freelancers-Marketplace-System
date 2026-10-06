const cloudinary = require('cloudinary').v2;
const https = require('https');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 's5moukpf',
  api_key: '424452388636344',
  api_secret: 'EZAAdTgHpnvv7qIWEhhpJUs8jp4'
});

// A dummy PDF file buffer (PDF header %PDF-1.4)
const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n200\n%%EOF');

// Upload as raw with .dat extension
cloudinary.uploader.upload_stream(
  {
    folder: 'gigsphere/documents',
    resource_type: 'raw',
    public_id: `${Date.now()}_test_file.dat`
  },
  (error, result) => {
    if (error) {
      console.error('Upload Error:', error);
      process.exit(1);
    }
    console.log('Upload Result:', result);
    const url = result.secure_url;
    
    // Attempt download of the .dat file
    https.get(url, (res) => {
      console.log('Download Status:', res.statusCode);
      console.log('Download Headers:', res.headers);
      process.exit(0);
    }).on('error', (err) => {
      console.error('Download Error:', err);
      process.exit(1);
    });
  }
).end(pdfBuffer);
