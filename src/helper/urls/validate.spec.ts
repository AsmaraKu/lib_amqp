import test from 'ava';

import { isAmqpUrlValid } from './validate';

// Setup
const validUrls = [
  'amqp://test:test@localhost:1579',
  'amqp://localhost',
  'amqp://mq.svc.resources.cluster.local/dev',
];
const invalidUrlWithinValidUrls = [
  'amqp://test:test@localhost:1579',
  'oh-oh',
  'amqp://test:test@localhost:1578',
];
const invalidUrls = [
  'not even a url',
  'http://not-amqp',
  'ftp://not-really-amqp',
];

// Tests
test('should validate singular valid url', (t) => {
  validUrls.forEach((url) => {
    const isValid = isAmqpUrlValid(url);

    t.log(url, isValid);
    t.true(isValid);
  });
});

test('should invalidate singular invalid url', (t) => {
  invalidUrls.forEach((url) => {
    const isValid = isAmqpUrlValid(url);

    t.log(url, isValid);
    t.false(isValid);
  });
});

test('should validate array of valid urls', (t) => {
  t.true(isAmqpUrlValid(validUrls));
});

test('should invalidate array of invalid urls', (t) => {
  t.false(isAmqpUrlValid(invalidUrls));
});

test('should invalidate array of valid urls with one invalid urls', (t) => {
  t.false(isAmqpUrlValid(invalidUrlWithinValidUrls));
});
