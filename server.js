const net = require('net');
<<<<<<< HEAD
const { ConnectionPool, CPRequest } = require('./connection-pool');
const { connectionProps, poolOptions, port } = require('./conf.js');
const { TYPES } = require('tedious');
const reqBuilder = require('./request_builder')
var pool;
const crypto = require('crypto');
const regEx = /Sec-WebSocket-Key: (.*)/m;

let clients = [];

const replyClient = (result, clients) => {
  const buf2 = Buffer.from(JSON.stringify(result));
  // console.log(result, buf2.length);
  const messageLengthCode = (buf2.length <= 65535 && buf2.length >= 126)
  ? 126
  : buf2.length > 65535
  ? 127
  : buf2.length;

  const buf3 = (buf2.length <= 65535 && messageLengthCode === 126)
  ? Buffer.alloc(2)
  : messageLengthCode === 127
  ? Buffer.alloc(8)
  : ''
  if (buf3.length === 2)
    buf3.writeUInt16BE(buf2.length)
  else if (buf3.length === 8)
    buf3.writeBigUInt64BE(BigInt(buf2.length));

  const buf1 = buf3.length === 0 ?
    Buffer.from([129, messageLengthCode]):
    Buffer.concat([Buffer.from([129, messageLengthCode]), buf3]);
  // console.log(Buffer.concat([buf1, buf2]));
  // console.log(buf1);
  console.log('clients', clients.map(client => client.clientId), '\n length: ',clients.length);
  if (clients.length !== 0)
    clients.forEach(client => client.write(Buffer.concat([buf1, buf2])))
}

const makeRequest = (action, params, clients) => {
  let proc = '[dbo].[notifications_proc]';
  let dbJob = false;
  if (action === 'recognition' || action === 'notification') {
    proc = '[dbo].[notifications_proc]';
    dbJob = true;
  }
  else if(action === 'newOrder'){
    dbJob = false;
    replyClient({ action, response: '' }, clients);
  }
  if(dbJob)
  pool.newRequest((props) => {
    reqBuilder(proc, (response) => replyClient({ action, response }, clients), props, params);
  });
}

const server = net.createServer(client => {
=======
const crypto = require('crypto');
// const sql = require('mssql')
const port = 12345;
const regEx = /Sec-WebSocket-Key: (.*)/m;
const fun = require('./db-connection')
let clients = []
const server = net.createServer(client => {
  const replyClient = (result, clients) => {
    const buf2 = Buffer.from(result);
    console.log(result);
    const messageLengthCode = (buf2.length <= 65535 && buf2.length >= 126) ? 126 : buf2.length > 65535 ? 127 : buf2.length;
    const buf3 = (result.length <= 65535 && messageLengthCode === 126) ?
      Buffer.alloc(2) :
      messageLengthCode === 127 ? Buffer.alloc(8) :
        ''
    if (buf3.length === 2)
      buf3.writeUInt16BE(result.length)
    else if (buf3.length === 8)
      buf3.writeBigUInt64BE(BigInt(result.length));

    const buf1 = buf3.length === 0 ? Buffer.from([129, messageLengthCode]) : Buffer.concat([Buffer.from([129, messageLengthCode]), buf3])
    if (clients.length !== 0)
      clients.map(client => client.write(Buffer.concat([buf1, buf2])))
  }
>>>>>>> ff739d2d21c3952163afb152af8fa45d924b3abb
  client.on('error', (error) => {
    console.log(error)
  })
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
    }
    else {
      if (data[0] >> 7 === 1) {
        const opcode = data[0] & 0b00001111;
        const maskBit = data[1] & 0b10000000;
        const dataInner = data;
        if (maskBit == 128) {
          if (opcode === 1) {
<<<<<<< HEAD
            const messageLengthCode = dataInner.slice(1, 2) & 0b01111111;
=======
            const messageLengthCode = dataInner.slice(1) & 0b01111111;
>>>>>>> ff739d2d21c3952163afb152af8fa45d924b3abb
            let messageLength = 0;
            let maskKeyOffset = 0;
            messageLength = messageLengthCode;
            maskKeyOffset = 2
            if (messageLengthCode == 126) {
              messageLength = dataInner[2, 3];
              maskKeyOffset = 4
            }
            else if (messageLengthCode == 127) {
              messageLength = dataInner[2, 3, 4, 5];
              maskKeyOffset = 6
            }
            const maskKey = dataInner.slice(maskKeyOffset, maskKeyOffset + 4);
<<<<<<< HEAD
=======
            // console.log(maskKey);
>>>>>>> ff739d2d21c3952163afb152af8fa45d924b3abb
            let payloadDecoded = [];
            const payloadOffset = maskKeyOffset + 4;
            dataInner.map((byte, index) => {
              if (index >= payloadOffset) {
                const decodedByte = byte ^ maskKey[(index - payloadOffset) % 4];
                payloadDecoded = [...payloadDecoded, decodedByte]
              }
            });
<<<<<<< HEAD
            try {
              const bufPayload = Buffer.from(payloadDecoded);
              const data = JSON.parse(bufPayload.toString());
              // console.log('data', data);
              const action = data.action;
              let params, activeClients;
              if (action === 'recognition') {
                client.clientId = Number(data.person);
                client.id = Math.random();
                clients = [...clients, client];
                activeClients = [client];
                const userids = {
                  columns: [
                    { name: 'user_id', type: TYPES.Int },
                  ],
                  rows: [[data.person]]
                };
                params = [
                  {
                    name: 'user_ids',
                    type: TYPES.TVP,
                    value: userids
                  }
                ]
              }
              else {
                const userids = {
                  columns: [
                    { name: 'user_id', type: TYPES.Int },
                  ],
                  rows: data.people.map(id => [id])
                };
                params = [
                  {
                    name: 'user_ids',
                    type: TYPES.TVP,
                    value: userids
                  }
                ]
                activeClients = clients.filter(client => 
                  data.people.indexOf(client.clientId) >= 0
                );
              }
              console.log('data people ->', data.people, '\nactive', activeClients.map(client => client.clientId))
              console.log('all clients -> ', clients.map(client => client.clientId))
              makeRequest(action, params, activeClients)
            }
            catch (ex) {
              console.log(ex)
=======
            const bufPayload = Buffer.from(payloadDecoded);
            const data = JSON.parse(bufPayload.toString());
            const action = data.action;
            const people = data.people;
            console.log(action);
            if (action === 'recognition') {
              client.clientId = data.person;
              client.id = Math.random();
              clients = [...clients, client];
              console.log(client.id, client.clientId)
              fun(action, [data.person], (result) => replyClient(result, [client]));
            }
            else if (action === 'notification'){
              const receivers = clients.filter(socket => people.includes(socket.clientId))
              // console.log(people, receivers)
              fun(action, people, (result) => replyClient(result, receivers));
>>>>>>> ff739d2d21c3952163afb152af8fa45d924b3abb
            }
          }
          else if (opcode === 8) {
            clients = clients.filter(socket => socket.id !== client.id)
          }
        }
        else
          console.log(`maskbit not 1 \n`, data.slice(1, 2))
      }
      else
        console.log(`not final bit \n`, data.slice(1, 2));
    }
  })
<<<<<<< HEAD
  client.on('close', (had_err) => { if (had_err) console.log(had_err) })
});

server.on('error', (_) => console.log('blah blah'));
server.listen(port, () => {
  console.log(`server started on port ${port}`);
  pool = new ConnectionPool(poolOptions, connectionProps);
})
=======
  client.on('close', (had_err) => {if(had_err) console.log(had_err)})
});
server.on('error', (_) => console.log('blah blah'));
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
>>>>>>> ff739d2d21c3952163afb152af8fa45d924b3abb
