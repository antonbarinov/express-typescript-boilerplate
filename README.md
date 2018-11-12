## Simple run
```
# npm i -g pm2 typescript
# npm i
# npm start
```

go to http://localhost:3000/


## Advantage install and run
```
# npm i -g pm2 typescript
# cd /path/to/backend
# npm i
# tsc
// Run this command as root. pm2 will be run as 'develuser' user after system reboots.
# sudo pm2 startup -u develuser
# pm2 startOrRestart pm2.config.js
# pm2 save
```
After that backend with api and services will also starts after system reboot