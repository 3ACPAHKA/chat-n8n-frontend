const { fork, spawn } = require('child_process');
const path = require('path');

const proxyScript = path.join(__dirname, 'proxy.js');
const staticScript = path.join(__dirname, 'static.js');

console.log('Starting Chat Application...');

// 1. Start Node.js Services
const proxy = fork(proxyScript);
const staticServer = fork(staticScript);

// 2. Start Cloudflare Tunnels (External Access)
console.log('Starting Cloudflare Tunnels...');
const tunnelChat = spawn('cloudflared', ['tunnel', '--config', 'config.yml', 'run'], { stdio: 'ignore' });
const tunnelN8N = spawn('cloudflared', ['tunnel', '--config', 'n8n-config.yml', 'run'], { stdio: 'ignore' });

// Error Handling
proxy.on('error', (err) => console.error('Proxy failed:', err));
staticServer.on('error', (err) => console.error('Static server failed:', err));

process.on('SIGINT', () => {
    console.log('Stopping services...');
    proxy.kill();
    staticServer.kill();
    tunnelChat.kill();
    tunnelN8N.kill();
    process.exit();
});
