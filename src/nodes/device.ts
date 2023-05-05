import {NodeAPI} from 'node-red';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {Client} = require('@2colors/esphome-native-api');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package = require('../../package.json');
import {LogLevel} from '../lib/utils';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType(
    'esphome-device',
    function (this: any, config: any) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      self.config = config;

      RED.nodes.createNode(this, config);

      self.setMaxListeners(0);
      self.device = {};
      self.entities = [];
      self.current_status = 'disconnected';
      self.logger = parseInt(config?.loglevel);
      self.ble = Boolean(config?.ble);

      if (!config?.host || !config?.port) {
        return;
      }

      self.onStatus = function (string: string) {
        self.current_status = string;
        self.emit('onStatus', string);

        self.emit('onState', {key: 'status', state: string});
      };

      self.onState = function (object: any) {
        self.emit('onState', object);
      };

      self.onBle = function (object: any) {
        self.emit('onBle', object);
      };

      let options: any = {
        host: config.host,
        port: config.port,
        clientInfo: Package.name + ' ' + Package.version,
        initializeDeviceInfo: true,
        initializeListEntities: true,
        initializeSubscribeStates: true,
        reconnect: true,
        reconnectInterval: 15 * 1000,
        pingInterval: 15 * 1000,
        initializeSubscribeBLEAdvertisements: self.ble
      };

      if (self.credentials.encryptionkey) {
        options = {
          ...options,
          encryptionKey: self.credentials.encryptionkey
        };
      } else {
        options = {
          ...options,
          password: self.credentials.password
        };
      }

      if (self.logger) {
        options = {
          ...options,
          initializeSubscribeLogs: {
            level: config.loglevel,
            dumpConfig: config.logdump
          }
        };
      }

      self.client = new Client(options);

      try {
        self.client.connect();
        self.client.connection.setMaxListeners(0);
      } catch (e: any) {
        self.error(e.message);
        return;
      }

      self.client.on('error', (e: Error) => {
        self.error(e.message);
        self.onStatus('error');
      });

      self.client.on('disconnected', () => {
        self.onStatus('disconnected');
      });

      self.client.on('connected', () => {
        // clear entities
        self.entities = [];
        // logs to entities
        if (self.logger) {
          self.entities.push({
            key: 'logs',
            type: 'Systems',
            name: 'Logs',
            config: {
              deviceClass: LogLevel[config.loglevel]
            }
          });
        }
        // ble to entities
        if (self.ble) {
          self.entities.push({
            key: 'ble',
            type: 'Systems',
            name: 'BLE'
          });
        }
        // status to entities
        self.entities.push({
          key: 'status',
          type: 'Systems',
          name: 'Status'
        });

        self.onStatus('connecting');
      });

      self.client.on('initialized', () => {
        self.onStatus('connected');
      });

      self.client.on('deviceInfo', (deviceInfo: any) => {
        self.device = deviceInfo;
      });

      self.client.on('newEntity', (entity: any) => {
        self.entities.push({
          key: entity.id,
          type: entity.type,
          name: entity.name,
          config: entity.config
        });

        entity.on('state', (state: any) => {
          self.onState({...state});
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        entity.on('error', (e: Error) => {
          /* empty */
        });
      });

      // logs
      self.client.on('logs', (payload: any) => {
        self.onState({key: 'logs', ...payload});
      });

      // ble
      self.client.on('ble', (payload: any) => {
        self.onBle({key: 'ble', ...payload});
      });

      self.on('close', () => {
        self.client.disconnect();
      });
    },
    {
      credentials: {
        encryptionkey: {type: 'password'},
        password: {type: 'password'}
      }
    }
  );
};
