import {NodeAPI} from 'node-red';
import {Status, roundToX} from '../lib/utils';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('esphome-in', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // system
    self.text_status = undefined;

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
          if (current_status != 'connected' || self.text_status == 'connected') {
            self.status(Status[current_status]);
          }
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
      const payload: any = {...state};
      const topic: any = config.topic === undefined ? '' : config.topic;

      // All Entities
      let stateEntity = config.entity;
      if (config.entity === 'all-entities') {
        const system: any = self.deviceNode.entities.find((e: any) => e.key == payload.key);
        if (system && system.type !== 'Systems') {
          stateEntity = payload.key;
        }
      }

      if (payload.key != stateEntity) {
        return;
      }

      delete payload.key;

      const entity: any = self.deviceNode.entities.find((e: any) => e.key == stateEntity);

      let text: string = '';
      if (typeof payload.state !== 'undefined') {
        if (typeof payload.state === 'object') {
          text = 'json';
        } else {
          if (entity.config && entity.config.accuracyDecimals >= 0) {
            text = String(roundToX(payload.state, entity.config.accuracyDecimals));
          } else {
            text = String(payload.state);
          }
        }

        if (text && text.length > 32) {
          text = `${text.substring(0, 32)}...`;
        }
        if (text && entity.config && entity.config.unitOfMeasurement) {
          text = `${text} ${entity.config.unitOfMeasurement}`;
        }
      }

      text = config.entity === 'all-entities' ? 'All Entities' : text;
      setStatus({fill: 'yellow', shape: 'dot', text: text}, 3000);

      self.send({
        topic: topic,
        payload: payload,
        device: self.deviceNode.device,
        entity: entity
      });
    };

    const onBle = (data: any) => {
      let address: string = config.bleaddress;
      const payload: any = {...data};

      address = address.toLowerCase().replace(/[^a-f0-9]/g, '');
      payload.address = payload.address.toString(16);

      if (payload.address != address) {
        return;
      }

      delete payload.key;

      setStatus({fill: 'blue', shape: 'dot', text: 'BLE'}, 3000);

      const entity: any = self.deviceNode.entities.find((e: any) => e.key == config.entity);

      self.send({
        payload: payload,
        device: self.deviceNode.device,
        entity: entity
      });
    };

    const onStatus = (status: string) => {
      setStatus(Status[status as string]);
    };

    self.onState = (state: any) => onState(state);
    self.deviceNode.on('onState', self.onState);

    self.onBle = (data: any) => onBle(data);
    self.deviceNode.on('onBle', self.onBle);

    self.onStatus = (status: string) => onStatus(status);
    self.deviceNode.on('onStatus', self.onStatus);

    self.on('close', (_: any, done: () => any) => {
      self.deviceNode.removeListener('onState', self.onState);
      self.deviceNode.removeListener('onBle', self.onBle);
      self.deviceNode.removeListener('onStatus', self.onStatus);
      done();
    });
  });
};
