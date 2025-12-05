import {NodeAPI} from 'node-red';
import {Status, roundToX} from '../lib/utils';

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

    const clearStatus = (timeout = 0) => {
      const current_status: string = self.deviceNode.current_status;
      setTimeout(() => {
        if (current_status) {
          self.status(Status[current_status as string]);
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
        self.error(`Entity (${config.entity}) not found on device`);
        done();
        return;
      }

      const regexpType = /^(BinarySensor|Sensor|TextSensor)$/gi;
      const regexpEntity = /^(Logs|BLE|Status)$/gi;
      if (entity.type.match(regexpType) || config.entity.match(regexpEntity)) {
        done();
        return;
      }

      const payload: any = msg.payload;
      let text: string;
      if (typeof payload.state !== 'undefined' && typeof payload.state !== 'object') {
        if (entity.config && entity.config.accuracyDecimals >= 0) {
          text = String(roundToX(payload.state, entity.config.accuracyDecimals));
        } else {
          text = String(payload.state);
        }
      } else {
        if (typeof payload !== 'undefined' && typeof payload === 'object') {
          text = 'json';
        } else {
          if (entity.config && entity.config.accuracyDecimals >= 0) {
            text = String(roundToX(payload, entity.config.accuracyDecimals));
          } else {
            text = String(payload);
          }
        }
      }
      if (text && text.length > 32) {
        text = `${text.substring(0, 32)}...`;
      }
      if (text && entity.config && entity.config.unitOfMeasurement) {
        text = `${text} ${entity.config.unitOfMeasurement}`;
      }

      try {
        const command = capitalize(entity.type + 'CommandService');
        await self.deviceNode.client.connection[command]({key: config.entity, ...payload});
        if (text) setStatus({fill: 'yellow', shape: 'dot', text: text});
      } catch (e: any) {
        setStatus(Status['error'], 3000);
        self.error(e.message);
      }

      done();
    });

    const onStatus = (status: string) => {
      setStatus(Status[status as string]);
    };

    self.onStatus = (status: string) => onStatus(status);
    self.deviceNode.on('onStatus', self.onStatus);

    self.on('close', (_: any, done: () => any) => {
      self.deviceNode.removeListener('onStatus', self.onStatus);
      done();
    });
  });
};
