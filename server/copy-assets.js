const fs = require('fs');
const path = require('path');

const srcLogin = '/Users/kunalraikwar/.gemini/antigravity-ide/brain/340efada-a823-4eb3-a0c5-4a42703eb256/factory_bori_bg_1789033380474.jpg';
const srcDashboard = '/Users/kunalraikwar/.gemini/antigravity-ide/brain/340efada-a823-4eb3-a0c5-4a42703eb256/dashboard_factory_banner_1789033412095.jpg';

const destDir = path.join(__dirname, '../client/public');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcLogin)) {
  fs.copyFileSync(srcLogin, path.join(destDir, 'login-bg.jpg'));
  console.log('Copied login-bg.jpg');
}

if (fs.existsSync(srcDashboard)) {
  fs.copyFileSync(srcDashboard, path.join(destDir, 'dashboard-banner.jpg'));
  console.log('Copied dashboard-banner.jpg');
}
