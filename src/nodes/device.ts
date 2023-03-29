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
      self.log_enable = false;

      if (!config?.host || !config?.port) {
        return;
      }

      // logs
      if (config?.loglevel > 0) {
        self.log_enable = true;
        self.log_key = 'logs-' + config.loglevel;
      }

      self.onStatus = function (string: string) {
        self.current_status = string;
        self.emit('onStatus', string);
      };

      self.onState = function (object: any) {
        self.emit('onState', object);
      };

      let options: any = {
        host: config.host,
        port: config.port,
        password: self.credentials.password,
        clientInfo: Package.name + ' ' + Package.version,
        initializeDeviceInfo: true,
        initializeListEntities: true,
        initializeSubscribeStates: true,
        reconnect: true,
        reconnectInterval: 15 * 1000,
        pingInterval: 15 * 1000
      };

      if (this.log_enable) {
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
        if (e.message.includes('EHOSTUNREACH')) {
          /* empty */
        } else if (e.message.includes('Invalid password')) {
          /* empty */
        } else if (e.message.includes('ECONNRESET')) {
          /* empty */
        } else if (e.message.includes('TIMEOUT')) {
          /* empty */
        } else if (e.message.includes('write after end')) {
          /* empty */
        } else {
          // copy this error to issues ...
        }
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
        if (this.log_enable) {
          self.entities.push({
            key: this.log_key,
            type: 'Systems',
            name: 'Logs',
            config: {
              deviceClass: LogLevel[config.loglevel]
            }
          });
        }

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

      if (this.log_enable) {
        self.client.on('logs', (payload: any) => {
          self.onState({key: this.log_key, ...payload});
        });
      }

      self.on('close', () => {
        self.client.disconnect();
      });
    },
    {
      credentials: {
        password: {type: 'password'}
      }
    }
  );
};
