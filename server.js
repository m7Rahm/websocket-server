const net = require('net');
const crypto = require('crypto');
const sql = require('mssql')
const port = 12345;
const regEx = /Sec-WebSocket-Key: (.*)/m;

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
      }, 10000);
      client.on('error', _ => clearInterval(id))
    }
    else {
      if (data[0] >> 7 == 1) {
        const opcode = data.slice(0,1) & 0b00001111;
        const maskBit = data.slice(1,2) & 0b10000000;
        // console.log(data)
        if (maskBit == 128) {
          const messageLengthCode = data.slice(1) & 0b01111111;
          let messageLength = 0;
          let maskKeyOffset = 0
          messageLength = messageLengthCode;
          maskKeyOffset = 2
          if (messageLengthCode == 126) {
            messageLength = data[2, 3];
            maskKeyOffset = 4
          }
          else if (messageLengthCode == 127) {
            messageLength = data[2, 3, 4, 5];
            maskKeyOffset = 6
          }
          const maskKey = data.slice(maskKeyOffset, maskKeyOffset + 4);
          // console.log(maskKey);
          let payloadDecoded = [];
          const payloadOffset = maskKeyOffset + 4;
          data.map((byte, index) => {
            if (index >= payloadOffset) {
              const decodedByte = byte ^ maskKey [(index - payloadOffset) % 4];
              payloadDecoded = [...payloadDecoded, decodedByte]
            }
          });
          const bufPayload = Buffer.from(payloadDecoded)
          // console.log(bufPayload.toString())
        }
        else
          console.log(`maskbit not 1 \n`,  data.slice(1, 2))
      }
      else
        console.log(`not final bit \n`, data.slice(1, 2));
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
// buf2.map(byte => console.log(byte))
// // console.log(Buffer.concat([buf1,buf2]))
// console.log(buf2.length)