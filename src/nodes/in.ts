import {NodeAPI} from 'node-red';
import {Status} from '../lib/utils';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('esphome-in', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    try {
      self.deviceNode = RED.nodes.getNode(self.config.device);
    } catch (_) {
      /* empty */
    }

    if (!self.deviceNode || !self.config.entity) {
      return;
    }

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

    const onState = (state: any) => {
      if (state.key != config.entity) {
        return;
      }

      const entity: any = self.deviceNode.entities.find((e: any) => e.key == config.entity);

      setStatus({fill: 'yellow', shape: 'dot', text: 'data'}, 3000);

      self.send({
        payload: state,
        device: self.deviceNode.device,
        config: entity?.config,
        entity: entity
      });
    };

    const onStatus = (status: string) => {
      self.current_status = status;

      setStatus(Status[self.current_status as string]);
    };

    self.onState = (state: any) => onState(state);
    self.deviceNode.on('onState', self.onState);

    self.onStatus = (status: string) => onStatus(status);
    self.deviceNode.on('onStatus', self.onStatus);

    self.on('close', (_: any, done: () => any) => {
      self.deviceNode.removeListener('onState', self.onState);
      self.deviceNode.removeListener('onStatus', self.onStatus);
      done();
    });
  });
};
