import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, Options } from 'amqplib';

import { Connection } from './connection';

export type Exchange = {
  name: string;
  type: 'direct' | 'fanout' | 'topic';

  options?: Options.AssertExchange;
};

export type Route = {
  exchange: Exchange;
  binding: string;
};

export type QueueChannel = {
  name: string;
  routes: Route[];

  options?: Options.AssertQueue & {
    /**
     * Number of message locally processed at one time per queue channel
     */
    prefetch?: number;
  };

  channel: ChannelWrapper;
};

type QueueOptions = Omit<QueueChannel, 'channel'>;

const buildRouteAssert = (
  channel: Readonly<Channel>,
  queueName: QueueChannel['name'],
  { binding, exchange: { name, type, options } }: Readonly<Route>
) => {
  return [
    channel.assertExchange(name, type, { ...options }),
    channel.bindQueue(queueName, name, binding),
  ];
};

const buildRoutesPromises = (
  channel: Readonly<Channel>,
  queueName: QueueChannel['name'],
  routes: readonly Route[]
) => {
  return routes.flatMap((route) => buildRouteAssert(channel, queueName, route));
};

export const createQueueChannel = async (
  connection: Readonly<Connection>,
  queue: Readonly<QueueOptions>
): Promise<QueueChannel> => {
  const channelWrapper = connection.manager.createChannel({
    setup: async (channel: Readonly<Channel>) => {
      return Promise.all([
        channel.assertQueue(queue.name, { ...queue.options }),

        ...buildRoutesPromises(channel, queue.name, queue.routes),

        queue.options?.prefetch
          ? channel.prefetch(queue.options.prefetch)
          : Promise.resolve(),
      ]);
    },
  });

  return {
    ...queue,
    channel: channelWrapper,
  };
};

export const addRoutesToQueueChannel = async (
  queue: Readonly<QueueChannel>,
  routes: readonly Route[]
): Promise<QueueChannel> => {
  await queue.channel.addSetup(async (channel: Readonly<Channel>) => {
    return buildRoutesPromises(channel, queue.name, routes);
  });

  return {
    ...queue,
    routes: [...queue.routes, ...routes],
  };
};
