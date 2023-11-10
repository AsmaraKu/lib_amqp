import { Channel, ConsumeMessage, Message } from 'amqplib';
import z from 'zod';

import { LoggerType } from '../types/logger';

import { QueueChannel } from './channel';

export type consumerFunc<MsgType extends z.ZodTypeAny> = (
  msg: MsgType,
  raw: Readonly<Message>
) => Promise<void>;

export type ConsumeOptions<MsgType extends z.ZodTypeAny> = {
  schema: MsgType;
  logger?: LoggerType;
};

/**
 * Consume queue safely.
 *
 * This function is a wrapper over your own function that handles the message from this queue. Before `func` is called
 * it will be parsed and validated according to your zod schema passed on the options.
 *
 * ### Example
 *
 * Here's a simple example of usage.
 *
 * ```typescript
 * import z from "zod";
 * import { safelyConsumeQueueChannel } from "@bitbybit-labs/amqp-lib/consumer";
 *
 * // ... instantiate your connection and channel here
 *
 * await safelyConsumeQueueChannel(
 *    queue,
 *    { schema: z.object({ ping: z.string() }) },
 *    async (msg) => {
 *        // strong typing on msg, and you can be assured that it will be valid
 *        console.log(msg.ping);
 *
 *        // If it returns without any error it will acknowledge it
 *        if (msg.ping === "ping") return;
 *        // This is highly unadvised to throw here, as it would result in the message being requeued
 *        // thus, please only throw error on error caused by an intermediary error(s)
 *        else throw new Error("not ping");
 *    }
 * )
 * ```
 *
 * @param queue QueueChannel made by `createQueueChannel`
 * @param options Options around schema and logger used
 * @param func This function will be called every time there's a new message consumed from the queue
 * @returns void
 */
export const safelyConsumeQueueChannel = async <MsgType extends z.ZodTypeAny>(
  queue: Readonly<QueueChannel>,
  options: Readonly<ConsumeOptions<MsgType>>,
  func: consumerFunc<MsgType>
) => {
  const log = options.logger ?? console;

  // eslint-disable-next-line functional/no-return-void
  const msgHandler = (msg: Readonly<ConsumeMessage | null>) => {
    if (msg !== null) {
      try {
        log.debug(`Handling new message!`);
        const parsedMessage = options.schema.parse(
          JSON.parse(msg.content.toString('utf-8'))
        );

        func(parsedMessage, msg).then(
          // eslint-disable-next-line functional/no-return-void
          () => {
            log.debug('Done handling message!');
            return queue.channel.ack(msg);
          },
          // eslint-disable-next-line functional/no-return-void
          (err) => {
            log.error(`Got error working on message`, err);
            log.error(`Parsed message causing error`, parsedMessage);

            return queue.channel.nack(msg);
          }
        );

        return;
      } catch (error) {
        log.error(`Error on parsing message`, error);

        return queue.channel.nack(msg, false, false);
      }
    } else {
      log.warn('Consumer cancelled by the server');
    }
  };

  return await queue.channel.addSetup(async (channel: Readonly<Channel>) => {
    return channel.consume(queue.name, msgHandler);
  });
};
