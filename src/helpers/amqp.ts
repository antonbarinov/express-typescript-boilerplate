import amqplib from 'amqplib';
import AmqpWrapper from 'lib/amqp_wrapper';
import config from 'helpers/config';

export let amqpWrapper: AmqpWrapper = null;

export const init = async (config: amqplib.Options.Connect) => {
    if (amqpWrapper === null) {
        amqpWrapper = new AmqpWrapper(config);
        await amqpWrapper.connect();
    }
}


interface SendEmailPayload {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const amqpSendEmail = async (payload: SendEmailPayload): Promise<boolean> => {
    const payloadString = JSON.stringify(payload);
    const queue = config.microServicesChannels.emailSender;

    try {
        await amqpWrapper.channel.sendToQueue(queue, Buffer.from(payloadString), { persistent: true });
    }
    catch (e) {
        // console.error(`Send to "${queue}" queue failed`, e.message);
        throw e;
    }

    return true;
}