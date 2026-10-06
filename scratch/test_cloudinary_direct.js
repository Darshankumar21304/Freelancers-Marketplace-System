const https = require('https');

const url = 'https://res.cloudinary.com/s5moukpf/raw/upload/v1788077031/gigsphere/documents/1788077029239_Evolish_Certificate_CERT-A1-N6NY9P.pdf';

https.get(url, (res) => {
  console.log('Direct Cloudinary Response Status:', res.statusCode);
  console.log('Direct Cloudinary Response Headers:', res.headers);
  process.exit(0);
}).on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
