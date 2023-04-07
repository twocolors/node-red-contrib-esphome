import {NodeAPI} from 'node-red';
import {Status} from '../lib/utils';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('esphome-out', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    try {
      self.deviceNode = RED.nodes.getNode(config.device);
    } catch (_) {
      /* empty */
    }

    if (!self.deviceNode || !config.entity) {
      return;
    }

    self.current_status = self.deviceNode.current_status;

    const clearStatus = (timeout = 0) => {
      setTimeout(() => {
        if (self.current_status) {
          self.status(Status[self.current_status as string]);
        } else {
          self.status({});
        }
      }, timeout);
    };

    const setStatus = (status: any, timeout = 0) => {
      self.status(status);
      if (timeout) {
        clearStatus(timeout);
      }
    };

    const capitalize = (s: string) => (s[0].toLowerCase() + s.slice(1)) as string;

    self.on('input', async (msg: any, send: () => any, done: () => any) => {
      const entity: any = self.deviceNode.entities.find((e: any) => e.key == config.entity);
      if (typeof entity == 'undefined') {
        setStatus(Status['error'], 3000);
        self.error(`entity (${config.entity}) not found on device`);
        done();
        return;
      }

      const regexpType = /^(BinarySensor|Sensor|TextSensor)$/gi;
      const regexpEntity = /^(Logs|BLE)$/gi;
      if (entity.type.match(regexpType) || config.entity.match(regexpEntity)) {
        done();
        return;
      }

      const payload: any = msg.payload;
      let text =
        typeof payload.state !== 'undefined' && typeof payload.state !== 'object' ? payload.state : inspect(payload);
      if (text && text.length > 32) {
        text = text.substr(0, 32) + '...';
      }
      setStatus({fill: 'yellow', shape: 'dot', text: text}, 3000);

      try {
        const command = capitalize(entity.type + 'CommandService');
        await self.deviceNode.client.connection[command]({key: config.entity, ...payload});
      } catch (e: any) {
        setStatus(Status['error'], 3000);
        self.error(e.message);
      }

      done();
    });

    const onStatus = (status: string) => {
      self.current_status = status;

      setStatus(Status[self.current_status as string]);
    };

    self.onStatus = (status: string) => onStatus(status);
    self.deviceNode.on('onStatus', self.onStatus);

    self.on('close', (_: any, done: () => any) => {
      self.deviceNode.removeListener('onStatus', self.onStatus);
      done();
    });
  });
};
