/**
 * In-process event bus. Webhook inserts and outbound sends emit 'message';
 * the SSE route (./routes/events.js) relays it to connected dashboards.
 */
const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(50);

module.exports = bus;
