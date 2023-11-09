import test from 'ava';
// import { once } from 'events';

import {
  closeConnection,
  createConnection,
  createConnectionOptions,
} from './connection';

const validLocalUrl = 'amqp://rabbitmq:rabbitmq@localhost:5672';

/**
 * Connection Options Test
 */
test('invalid url should returns undefined', (t) => {
  t.assert(createConnectionOptions({ url: 'not-a-url' }) === undefined);
});

test('invalid url in url array should returns undefined', (t) => {
  t.assert(
    createConnectionOptions({ url: ['not-a-url', validLocalUrl] }) === undefined
  );
});

test('should not return when config is empty', (t) => {
  // @ts-expect-error This test purposefully left out the config
  t.assert(createConnectionOptions() === undefined);
});

test('should not return when url in config is empty', (t) => {
  // @ts-expect-error This test purposefully left out the config
  t.assert(createConnectionOptions({}) === undefined);
});

test('should return same url on valid config', (t) => {
  const config = createConnectionOptions({ url: validLocalUrl });

  t.assert(config !== undefined, 'config should be valid');
  t.assert(config?.url === validLocalUrl, 'same url is returned');

  t.assert(
    config?.connectionOptions?.keepAlive === true,
    'should set default params'
  );
  t.assert(config?.reconnectTimeInSeconds === 5, 'should set default params');
});

test('should return same url array on valid config', (t) => {
  const validUrlArray = [validLocalUrl, validLocalUrl];
  const config = createConnectionOptions({ url: validUrlArray });

  t.assert(config !== undefined, 'config should be valid');
  t.assert(config?.url === validUrlArray, 'same url is returned');

  t.assert(
    config?.connectionOptions?.keepAlive === true,
    'should set default params'
  );
  t.assert(config?.reconnectTimeInSeconds === 5, 'should set default params');
});

test('should replace default config', (t) => {
  const config = createConnectionOptions({
    url: validLocalUrl,
    reconnectTimeInSeconds: 15,
    connectionOptions: {
      keepAlive: false,
    },
  });

  t.assert(
    config?.connectionOptions?.keepAlive === false,
    'should replace default params'
  );
  t.assert(
    config?.reconnectTimeInSeconds === 15,
    'should replace default params'
  );
});

/**
 * Create & Destroying Connection Test
 *
 * WARN: START THE RABBITMQ LOCALLY FIRST USING `docker compose`.
 *
 * NOTE(fauh45): We should mock the library here for sure...
 */

test('should create a connection to rabbitmq', async (t) => {
  const validConfig = createConnectionOptions({
    url: validLocalUrl,
  });

  if (!validConfig) return t.fail('config should be valid');

  const conn = createConnection(validConfig);
  t.notThrowsAsync(async () => await conn.manager.connect());

  // t.timeout(15_000);

  // TODO(fauh45): somehow this will only resolve after it returns...
  // const [{ url }] = await once(conn.manager, 'connect');
  // t.log('connected to', url);
  // t.assert(
  //   url.toString().startsWith(validLocalUrl),
  //   'connected to the right place'
  // );

  await closeConnection(conn);

  // t.timeout(15_000);

  // TODO(fauh45): somehow this will only resolve after it returns...
  // const disconnectResult = await once(conn.manager, 'disconnect');
  // t.log('disconnect event length', disconnectResult.length);
  // t.true(disconnectResult.length > 0, 'should get disconnected');

  return;
});
