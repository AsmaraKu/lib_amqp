# @asmaraku/lib-amqp

AMQP helper with auto-connect, and other life-saver features.

## Use Cases

Currently this library will support these use cases. Checklist means it has been implemented.

- [x] Connect to AMQP Server (RabbitMQ) through the URL
- [x] Setup auto-reconnection
- [x] Automatically assert exchange & queue
- [x] Add route between exchange + route
- [x] Safe consume (message parsed through Zod)
- [x] Easy type-safe publish (~~optionally~~ validated, strongly typed params)
- [x] One function call on exit to gracefully stop the app (e.g. `await close(connection)`)
- [ ] 100% test coverage, currently there's a lot of files without test
  - [ ] Add unit test for `/lib/channel.ts`
  - [ ] Add unit test for `/lib/consumer.ts`
  - [ ] Add unit test for `/lib/publisher.ts`

## Maintainer

fauh45 ([fauzan@bitbybit.studio](mailto:fauzan@bitbybit.studio))
