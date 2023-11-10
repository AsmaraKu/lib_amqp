import amqp, {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
} from 'amqp-connection-manager';

import { isAmqpUrlValid } from '../helper/urls/validate';
import { LoggerType } from '../types/logger';

/**
 * All the required objects to manage connection to AMQP cluster.
 */
export type Connection = {
  manager: AmqpConnectionManager;
};

/**
 * Connection options for connection manager to AMQP cluster.
 *
 * For the very basic usage, just fill in the `url` part with your env value.
 */
export type ConnectionOptions =
  // NOTE(fauh45): Remove `findServers` as it could shoot the dev in the foot. Not really needed in the current context of usage either.
  Omit<AmqpConnectionManagerOptions, 'findServers'> & {
    // NOTE(fauh45): This could be the type of ConnectionUrl (consist of object of options, or url with options, or just string).
    // It doesn't translate to types well, and we're only using connection string for now.
    url: string | string[];
    logger?: LoggerType;
  };

/**
 * Creates the configuration based on your options for connection to AMQP cluster.
 *
 * This will also set some sensible defaults for your connection. If there's an invalid url, it will *not* throws, instead returns undefined.
 *
 * @param opts connection options
 * @returns options or undefined if the url is invalid
 */
export const createConnectionOptions = (
  opts: Readonly<ConnectionOptions>
): ConnectionOptions | undefined => {
  if (!opts || !opts.url || !isAmqpUrlValid(opts.url)) return;

  return {
    connectionOptions: {
      ...opts.connectionOptions,
      keepAlive: opts.connectionOptions?.keepAlive ?? true,
    },
    ...opts,
    reconnectTimeInSeconds: opts.reconnectTimeInSeconds ?? 5,
  };
};

/**
 * Creates the Connection struct using a valid configuration.
 *
 * @param opts Options that has been created by {@link createConnectionOptions}. Please check if your options is valid or not.
 * @returns Connection struct
 */
export const createConnection = (
  opts: Readonly<ConnectionOptions>
): Connection => {
  // NOTE(fauh45): should we check opts here? I feel like it should be already checked from the connection options
  const { url, ...restOfOpts } = opts;

  const log = opts.logger ?? console;
  const manager = amqp.connect(url, restOfOpts);

  manager.on('connect', log.debug);
  manager.on('disconnect', log.debug);
  manager.on('connectFailed', log.warn);

  return { manager };
};

/**
 * Gracefully close the connection.
 *
 * @param connection Connection struct created by {@link createConnection}
 */
export const closeConnection = async (connection: Readonly<Connection>) => {
  const { manager } = connection;

  await manager.close();
};
