const fs = require('fs');

let data = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
  data += chunk;
});

process.stdin.on('end', function() {
  // Replace OPENAI_API_KEY=... with OPENAI_API_KEY=your-api-key
  // Matches "OPENAI_API_KEY=" followed by any characters until end of line
  const cleanData = data.replace(/(OPENAI_API_KEY\s*=\s*)([^\r\n]*)/g, '$1your-api-key');
  process.stdout.write(cleanData);
});
