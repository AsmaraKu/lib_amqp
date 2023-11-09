# @asmaraku/lib-amqp

AMQP helper with auto-connect, and other life-saver features.

## Use Cases

Currently this library will support these use cases. Checklist means it has been implemented.

- [x] Connect to AMQP Server (RabbitMQ) through the URL
- [x] Setup auto-reconnection
- [ ] Automatically assert exchange & queue
- [ ] Add route between exchange + route
- [ ] Safe consume (message parsed through Zod)
- [ ] Easy type-safe publish (optionally validated, strongly typed params)
- [ ] One function call on exit to gracefully stop the app (e.g. `await close(connection)`)

## Maintainer

fauh45 ([fauzan@bitbybit.studio](mailto:fauzan@bitbybit.studio))
