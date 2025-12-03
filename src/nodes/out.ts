import {NodeAPI} from 'node-red';
import {Status} from '../lib/utils';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('esphome-out', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    try {
      self.deviceNode = RED.nodes.getNode(config.device);
    } catch (e: any) {
      self.error(`Failed to get device node: ${e.message}`);
      self.status({fill: 'red', shape: 'ring', text: 'device error'});
      return;
    }

    if (!self.deviceNode) {
      self.error('Device node not found or not configured');
      self.status({fill: 'red', shape: 'ring', text: 'no device'});
      return;
    }
    
    if (!config.entity) {
      self.error('Entity not configured');
      self.status({fill: 'red', shape: 'ring', text: 'no entity'});
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
      try {
        if (!self.deviceNode || !self.deviceNode.entities) {
          setStatus(Status['error'], 3000);
          self.error('Device node not ready or entities not loaded');
          done();
          return;
        }

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
          text = String(payload.state);
        } else {
          if (typeof payload !== 'undefined' && typeof payload === 'object') {
            text = 'json';
          } else {
            text = String(payload);
          }
        }
        if (text && text.length > 32) {
          text = `${text.substring(0, 32)}...`;
        }

        try {
          if (!self.deviceNode.client || !self.deviceNode.client.connection) {
            setStatus(Status['error'], 3000);
            self.error('Device not connected');
            done();
            return;
          }

          const command = capitalize(entity.type + 'CommandService');
          await self.deviceNode.client.connection[command]({key: config.entity, ...payload});
          if (text) setStatus({fill: 'yellow', shape: 'dot', text: text});
        } catch (e: any) {
          setStatus(Status['error'], 3000);
          self.error(`Command failed: ${e.message}`);
        }

        done();
      } catch (e: any) {
        setStatus(Status['error'], 3000);
        self.error(`Input processing error: ${e.message}`);
        done();
      }
    });

    const onStatus = (status: string) => {
      try {
        setStatus(Status[status as string]);
      } catch (e: any) {
        self.error(`Status processing error: ${e.message}`);
      }
    };

    self.onStatus = (status: string) => {
      try {
        onStatus(status);
      } catch (e: any) {
        self.error(`Status handler error: ${e.message}`);
      }
    };
    
    try {
      if (self.deviceNode && typeof self.deviceNode.on === 'function') {
        self.deviceNode.on('onStatus', self.onStatus);
      }
    } catch (e: any) {
      self.error(`Failed to attach status listener: ${e.message}`);
    }

    self.on('close', (_: any, done: () => any) => {
      try {
        if (self.deviceNode && typeof self.deviceNode.removeListener === 'function') {
          self.deviceNode.removeListener('onStatus', self.onStatus);
        }
      } catch (e: any) {
        // Ignore cleanup errors to prevent crashes during shutdown
      }
      done();
    });
  });
};
