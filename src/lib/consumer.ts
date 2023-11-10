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
