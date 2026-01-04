import http from 'http';

http.get('http://localhost:8081/api/vault?limit=1', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
