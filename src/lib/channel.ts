import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, Options } from 'amqplib';

import { Connection } from './connection';

/**
 * Representation of an AMQP Exchange.
 *
 * See more: [RabbitMQ docs](https://www.rabbitmq.com/tutorials/amqp-concepts.html#amqp-model)
 */
export type Exchange = {
  name: string;
  type: 'direct' | 'fanout' | 'topic';

  options?: Options.AssertExchange;
};

/**
 * Route represents binding from an exchange to queue.
 *
 * Binding is a string, and is equal to routes in AMQP 0-9-1 terms.
 *
 * See more: [RabbitMQ docs](https://www.rabbitmq.com/tutorials/amqp-concepts.html#bindings)
 */
export type Route = {
  exchange: Exchange;
  /**
   * Equals to route in AMQP 0-9-1 terms.
   */
  binding: string;
};

/**
 * As many use cases uses one channel per queue, it has been made into one representation here.
 *
 * A QueueChannel represents a valid queue, and all the valid routes. Although this statement is only true
 * if the addition and creation of the QueueChannel is done through the function defined in this module.
 */
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

// NOTE(fauh45): channel is omitted out here as it will be instantiated when the QueueChannel created
export type QueueOptions = Omit<QueueChannel, 'channel'>;

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

/**
 * This function will create a queue channel.
 *
 * Behind the scene this function will assert the queue, then each of the routes will result in the assertion of the exchange and the binds.
 * Lastly it will assert the prefetch amount set on the options. This is the typical workflow done when creating a new queue, thus why it
 * made into one functions.
 *
 * This function will also make sure that every step above will be done each time reconnection happen. So even if you made a queue/exchange
 * non-durable, next time it connects you ~~can be reassured that it would be there~~ (statement withheld before the correct test).
 *
 * @param connection connection made by `createConnection` function
 * @param queue options to instantiate the queue
 * @returns Promise of QueueChannel
 */
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

/**
 * This function is used to add a new routing for the queue.
 *
 * Before returning the new QueueChannel (a new instance by the way, as most if not all function here is immutable) it will assert the exchange
 * and also binds it with the queue itself. Same as {@link createQueueChannel | `createQueueChannel`} function, this will also make sure that
 * every time there's a reconnection it will re-do the binding and assertion.
 *
 * @param queue {@link QueueChannel | QueueChannel} created by {@link createQueueChannel | `createQueueChannel`}
 * @param routes definition of the new {@link Route} as an array, because you can add more than just one routes
 * @returns a new instance of QueueChannel with the new routes appended
 */
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
