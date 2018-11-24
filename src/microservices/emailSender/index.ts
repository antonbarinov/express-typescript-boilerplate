"use strict";

// Enironment
process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();

// Ensure we're in the project directory, so relative paths work as expected no matter where we actually lift from.
const rootDir = __dirname + '/../../'
process.chdir(rootDir);

// Absolute modules require's without node_modules
process.env.NODE_PATH = rootDir;
process.env.ROOT_DIR = rootDir;
require('module').Module._initPaths();



import nodemailer from 'nodemailer';
import config from 'helpers/config';
import AmqpWrapper from 'lib/amqp_wrapper';
const amqpWrapper = new AmqpWrapper(config.rabbitMQ);


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport(config.nodeMailerSMTP);


function sendMail(msg, ch) {
    const data = JSON.parse(msg.content.toString());

    // setup email data with unicode symbols
    const options = {
        from: `"Foo Bar" <${config.nodeMailerSMTP.auth.user}>`,
        ...data
    };

    if (!options.text) options.text = options.html;
    if (!options.html) options.html = options.text;


    // Example
    let mailOptions = {
        from: '"Fred Foo 👻" <no_reply@example.com>', // sender address
        to: 'bar@example.com, baz@example.com', // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    };

    // send mail
    transporter.sendMail(options, (error, info) => {
        ch.ack(msg);

        if (error) {
            console.error(`Send email to "${options.to} has been failed"`);
            console.error(error);

            return false;
        }
    });
}



(async () => {
    await amqpWrapper.connect();
    
    // Process consumer logic
    amqpWrapper.listner(async (ch, conn) => {
        const queueChannel = config.microServicesChannels.emailSender;

        // Check acccess to queue
        await ch.assertQueue(queueChannel, {
            durable: true, // the queue will survive broker restarts
        });
    
        ch.prefetch(10);
    
        // Consumer
        ch.consume(queueChannel, async (msg) => {
            sendMail(msg, ch);
        }, {
            noAck: false, // All messages must be confirmed via 'ch.ack(msg);' for removing from queue
        });
    });
})();