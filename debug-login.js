import io from 'socket.io-client';
import { nanoid } from 'nanoid';

const HOST = 'https://v3-rc.palringo.com';
const PORT = 443;
const TOKEN = `WJS${nanoid(32)}`;

// Try to see if Wolf Live has a register or forgot-password endpoint
async function testCommands() {
  return new Promise((resolve) => {
    const socket = io(`${HOST}:${PORT}/?token=${TOKEN}&device=wjsframework&state=1&version=3.0.0`, {
      transports: ['websocket'],
      reconnection: false,
      autoConnect: false
    });

    const timer = setTimeout(() => { socket.disconnect(); resolve(); }, 30000);

    socket.onAny((event, data) => {
      if (event === 'welcome') {
        console.log('Connected. Testing registration...');
        
        // Try security register
        socket.emit('security register', {
          headers: { version: 2 },
          body: { 
            email: 'testbot12345@gmail.com',
            password: 'TestBot12345!',
            deviceToken: nanoid(16),
            language: 'ar'
          }
        }, (resp) => {
          console.log('REGISTER RESPONSE:', JSON.stringify(resp));
        });

        // Try subscriber create  
        setTimeout(() => {
          socket.emit('subscriber create', {
            headers: { version: 2 },
            body: { email: 'testbot12345@gmail.com', password: 'TestBot12345!' }
          }, (resp) => {
            console.log('SUBSCRIBER CREATE RESPONSE:', JSON.stringify(resp));
          });
        }, 3000);

        // Try forgot password
        setTimeout(() => {
          socket.emit('security password reset', {
            headers: { version: 2 },
            body: { email: 'x.z3l.king@gmail.com' }
          }, (resp) => {
            console.log('PASSWORD RESET RESPONSE:', JSON.stringify(resp));
            clearTimeout(timer);
            socket.disconnect();
            resolve();
          });
        }, 6000);
      }
    });

    socket.connect();
  });
}

console.log('🔍 Testing Wolf Live registration endpoints...\n');
await testCommands();
console.log('\n✅ Done');
