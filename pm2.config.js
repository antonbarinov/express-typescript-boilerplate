module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [
        // First application
        {
            name: 'api',
            script: 'dist/master.js',

            merge_logs: true,
            log_date_format: "DD.MM.YYYY HH:mm:ss"
        },
        {
            name: 'service--emailSender',
            script: 'dist/services/emailSender/master.js',

            merge_logs: true,
            log_date_format: "DD.MM.YYYY HH:mm:ss"
        },
    ]
};
