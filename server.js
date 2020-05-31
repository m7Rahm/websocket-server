const net = require('net');
const crypto = require('crypto')
const port = 12345;
const regEx = /Sec-WebSocket-Key: (.*)/m
const server = net.createServer((client) => {
  client.on('data', (data) => {
    const bufferString = data.toString('utf8');
    const matches = bufferString.match(regEx);
    if (matches != null) {
      const key = matches[1];
      const responseKey = key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
      const keyB64 = crypto.createHash('SHA1').update(responseKey).digest('base64');
      client.write('HTTP/1.1 101 Switching Protocols\r\n');
      client.write('Upgrade: websocket\r\n');
      client.write('Connection: Upgrade\r\n');
      client.write('Sec-WebSocket-Version: 13\r\n');
      client.write(`Sec-WebSocket-Accept: ${keyB64}\r\n\r\n`);
      
      const id = setInterval(() => {

        const buf2 = Buffer.from(new Date().toLocaleTimeString());
        const messageLengthCode = buf2.length <= 126 ? buf2.length : 127
        const buf3 = messageLengthCode === 126 ?
          Buffer.alloc(2) :
          messageLengthCode === 127 ? Buffer.alloc(8) :
            ''
        if (buf3.length === 2)
          buf3.writeUInt16BE(new Date().toLocaleTimeString().length)
        else if (buf3.length === 8)
          buf3.writeBigUInt64BE(BigInt(new Date().toLocaleTimeString().length));

        const buf1 = buf3.length === 0 ? Buffer.from([129, messageLengthCode]) : Buffer.concat([Buffer.from([129, messageLengthCode]), buf3])
        client.write(Buffer.concat([buf1, buf2]))
      }, 1000);
      client.on('error', _ => clearInterval(id))
     
    }
    else {
      console.log(data);
    }
  })
  client.on('close', (had_err) => console.log(had_err))
});
server.on('error', (err) => console.log('blah blah'));
server.listen(port, () => {
  console.log(`server started on port ${port}`);
})
// buf1 = Buffer.from([129, 5]);
// buf2 = Buffer.from('Ə');
// // buf3 = Buffer.allocUnsafe(2);
// // buf3.writeUInt16BE(123456789)

// // console.log(Buffer.concat([buf1,buf2]))
// console.log(buf2.length)