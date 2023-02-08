import {NodeAPI} from 'node-red';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {Client} = require('@2colors/esphome-native-api');

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

      if (!config?.host || !config?.port || !self.credentials?.password) {
        return;
      }

      self.onStatus = function (string: string) {
        self.current_status = string;
        self.emit('onStatus', string);
      };

      self.onState = function (object: any) {
        self.emit('onState', object);
      };

      self.client = new Client({
        host: config.host,
        port: config.port,
        password: self.credentials.password,
        clientInfo: 'node-red',
        initializeDeviceInfo: true,
        initializeListEntities: true,
        initializeSubscribeStates: false,
        reconnect: true,
        reconnectInterval: 15 * 1000,
        pingInterval: 5 * 1000
      });

      try {
        self.client.connect();
      } catch (e: any) {
        self.error(e.message);
        return;
      }

      self.client.on('error', (e: Error) => {
        if (e.message.includes('EHOSTUNREACH')) {
          /* empty */
        } else if (e.message.includes('Invalid password')) {
          self.error(e.message);
        } else if (e.message.includes('ECONNRESET')) {
          /* empty */
        } else if (e.message.includes('TIMEOUT')) {
          /* empty */
        } else if (e.message.includes('write after end')) {
          /* empty */
        } else {
          // copy this error to issues ...
        }
        self.onStatus('error');
      });

      self.client.on('disconnected', () => {
        self.onStatus('disconnected');
      });

      self.client.on('connected', () => {
        // clear entities
        self.entities = [];

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

        entity.connection.subscribeStatesService();

        entity.on('state', (state: any) => {
          self.onState({...state});
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        entity.on('error', (e: Error) => {
          /* empty */
        });
      });

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
