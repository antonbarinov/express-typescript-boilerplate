## Install and run
```
# npm i -g pm2 typescript
# cd /path/to/backend
# npm i
# tsc
// Run this command as root. pm2 will be run as 'develuser' user after system reboots.
# sudo pm2 startup -u develuser
# pm2 delete all
# pm2 startOrRestart pm2.config.js
# pm2 save
```
After that backend with api and services will also starts after system reboot

## Other scripts
```
// Run database migrations
npm run db:migrate
```