import { handleJsonRpc } from './index.js';

process.stdin.setEncoding('utf8');

let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        handleJsonRpc(request).then((response) => {
          process.stdout.write(JSON.stringify(response) + '\n');
        }).catch((error) => {
          const errorResponse = { 
            jsonrpc: '2.0', 
            id: request.id, 
            error: { code: -32000, message: error.message } 
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        });
      } catch (e) {
        process.stderr.write('Error parsing JSON: ' + e.message + '\n');
      }
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});
