const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Lumaa AI Dashboard...');
console.log('===================================\n');

// Start backend
console.log('📡 Starting backend server (port 4001)...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait 2 seconds then start frontend
setTimeout(() => {
  console.log('\n🎨 Starting frontend server (port 4000)...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('❌ Frontend error:', error);
  });
}, 2000);

backend.on('error', (error) => {
  console.error('❌ Backend error:', error);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Dashboard servers...');
  process.exit();
});

console.log('\n✅ Dashboard will be available at: http://localhost:4000');
console.log('✅ Backend API at: http://localhost:4001\n');