
import http from 'http';

http.get('http://localhost:8081/', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Body start:', data.substring(0, 100));
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
