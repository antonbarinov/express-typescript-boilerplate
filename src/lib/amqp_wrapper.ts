import amqp from 'amqplib';
import * as amqpTypes from 'amqplib';
import QueueHolder from 'queue-holder';
import { sleep } from 'helpers/functions';

interface AmqpConfig {
    protocol: string;
    hostname: string;
    port: number;
    username: string;
    password: string;
    locale?: string;
    frameMax?: number;
    heartbeat?: number;
    vhost: string;
}

interface amqpListnerFunc {
    (channel: amqpTypes.Channel, connect: amqpTypes.Connection): void
};


class AmqpWrapper {
    private connectionInProgress: boolean = false;
    private amqpConnected: boolean = false;
    private connectionKey: string = null;
    private config: amqp.Options.Connect = null;
    private connectionQueue: QueueHolder = null;
    private reconnects: number = 0;
    private listners: amqpListnerFunc[] = [
        this.processRpcChannel,
    ];
    private rpcQueueName: string = null;
    private rpcQueue: any = {};
    private queueId: number = 0;

    connection: amqpTypes.Connection = null;
    channel: amqpTypes.Channel = null;

    /**
     * Connect to amqp server and exec listners functions
     */
    async connect(): Promise<boolean> {
        await this.connectionQueue.hold();

        if (this.amqpConnected || this.connectionInProgress) {
            this.connectionQueue.release();
            return true;
        }

        this.connectionInProgress = true;

        while (this.connectionInProgress) {
            try {
                const conn = await amqp.connect(this.config);
                const ch = await conn.createChannel();

                this.connection = conn;
                this.channel = ch;

                this.reconnects = 0;

                /**
                 * Handle connection error and close
                 */
                conn.on('error', (err) => {
                    console.error(`${this.connectionKey} connection error:`, err);
                });

                conn.on('close', async () => {
                    console.error(`${this.connectionKey}:`, 'Connection closed');

                    this.amqpConnected = false;

                    this.connect();
                });

                /**
                 * Handle channel error and close
                 */
                ch.on('error', (err) => {
                    console.error(`${this.connectionKey} channel error:`, err);
                });

                ch.on('close', () => {
                    console.log(`${this.connectionKey}:`, 'Channel closed');
                });

                this.connectionInProgress = false;
                this.amqpConnected = true;

                console.log(`${this.connectionKey}:`, 'Connection success');

                
                /**
                 * Register all stuff
                 */
                for (const fn of this.listners) {
                    fn(this.channel, this.connection);
                }

                continue;
            } catch (e) {
                let seconds = this.reconnects;

                if (this.reconnects >= 60) {
                    seconds = 60;
                }

                console.error(`${this.connectionKey}:`, `Reconnect failed... Reason: ${e.message}. Waiting ${seconds} sec and trying to connect again...`);
                
                await this.connectionQueue.sleep(seconds);
            }

            this.reconnects++;
        }

        await this.connectionQueue.release();
    }

    constructor(config: amqp.Options.Connect) {
        this.connectionInProgress = false;
        this.amqpConnected = false;
        this.config = config;
    
        this.connectionKey = `{AMQP ${config.hostname}:${config.port}}`;

        this.connectionQueue = new QueueHolder();
    }

    /**
     * AMQP Processing
     * @param fn function that process amqp logic
     */
    listner(fn: (channel: amqpTypes.Channel, connect: amqpTypes.Connection) => void): void {
        this.listners.push(fn);
        
        if (this.amqpConnected) {
            fn(this.channel, this.connection);
        }
    }

    /**
     * Consumer for RPC's
     */
    private async processRpcChannel(channel: amqpTypes.Channel, connect: amqpTypes.Connection): Promise<void> {
        const q = await channel.assertQueue('', { exclusive: true });
        this.rpcQueueName = q.queue;
        
        channel.consume(q.queue, function(msg) {
            const id = msg.properties.correlationId;
            const queue = this.rpcQueue[id];

            if (queue) {
                let content = JSON.parse(msg.content.toString());
                if (content.resolve) {
                    queue.resolve(content.resolve);
                } else if (content.reject) {
                    queue.reject(content.reject);
                }
            }
        }, { noAck: true });
    }

    /**
     * Remote procedure call
     */
    rpc = (queueName: string, payload: any, queueOptions?: amqpTypes.MessageProperties): Promise<any> => new Promise((resolve, reject) => {
        if (typeof payload == 'object') payload = JSON.stringify(payload);
        
        if (this.queueId >= 99999999) this.queueId = 0;

        this.queueId++;
        const id = this.queueId + '';
    
        this.rpcQueue[id] = {
            resolve,
            reject
        };
    
        let expiration: any = 30 * 1000; // in ms
        if (queueOptions.expiration) {
            expiration = parseInt(queueOptions.expiration) * 1000;
            delete queueOptions.expiration;
        }
    
        // Remove expired and throw error
        setTimeout(() => {
            if (this.rpcQueue[id]) {
                this.rpcQueue[id].reject(`RPC timeout ${expiration}ms, queue: '${queueName}', payload: ${JSON.stringify(payload)}, options: ${JSON.stringify(queueOptions)}`);
                delete this.rpcQueue[id];
            }
        }, expiration);
    
        expiration = expiration + '';

        delete queueOptions.replyTo;
        delete queueOptions.correlationId;
    
        // Send to queue
        (async () => {
            try {
                await this.channel.sendToQueue(queueName, Buffer.from(payload), {
                    //persistent: true,
                    expiration: expiration,
                    correlationId: id,
                    replyTo: this.rpcQueueName,
                    ...queueOptions
                });
            }
            catch (e) {
                console.error(`Send to "${queueName}" queue failed`);
                reject(e);
                delete this.rpcQueue[id];;
            }
        })();
    });
    

    /**
     * Wait untill your process will be unique consumer
     * For example be only one publisher in system that can run many exemplars of this publishers
     */
    async beUnique(queueName: string) {
        const ch = this.channel;

        while (true) {
            try {
                const q = await ch.assertQueue(queueName, { exclusive: true });
                ch.consume(q.queue, () => { }, { noAck: true });

                return true;
            } catch (e) {
                await sleep(5000); // 5 sec
            }
        }
    }
}



export default AmqpWrapper;