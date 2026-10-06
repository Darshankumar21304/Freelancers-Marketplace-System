const cloudinary = require('cloudinary').v2;
const https = require('https');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 's5moukpf',
  api_key: '424452388636344',
  api_secret: 'EZAAdTgHpnvv7qIWEhhpJUs8jp4'
});

const publicId = 'gigsphere/documents/1788077029239_Evolish_Certificate_CERT-A1-N6NY9P.pdf';

// Generate a signed URL for download
const signedUrl = cloudinary.url(publicId, {
  resource_type: 'raw',
  sign_url: true,
  secure: true
});

console.log('Generated Signed URL:', signedUrl);

https.get(signedUrl, (res) => {
  console.log('Signed Response Status:', res.statusCode);
  console.log('Signed Response Headers:', res.headers);
  process.exit(0);
}).on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
