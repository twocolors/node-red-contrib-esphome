# node-red-contrib-esphome

[![platform](https://img.shields.io/badge/platform-Node--RED-red?logo=nodered)](https://flows.nodered.org/node/node-red-contrib-esphome)
[![Min Node Version](https://img.shields.io/node/v/node-red-contrib-esphome.svg)](https://nodejs.org/en/)
[![GitHub version](https://img.shields.io/github/package-json/v/twocolors/node-red-contrib-esphome?logo=npm)](https://www.npmjs.com/package/node-red-contrib-esphome)
[![GitHub stars](https://img.shields.io/github/stars/twocolors/node-red-contrib-esphome)](https://github.com/twocolors/node-red-contrib-esphome/stargazers)
[![Package Quality](https://packagequality.com/shield/node-red-contrib-esphome.svg)](https://packagequality.com/#?package=node-red-contrib-esphome)

[![issues](https://img.shields.io/github/issues/twocolors/node-red-contrib-esphome?logo=github)](https://github.com/twocolors/node-red-contrib-esphome/issues)
![GitHub last commit](https://img.shields.io/github/last-commit/twocolors/node-red-contrib-esphome)
![NPM Total Downloads](https://img.shields.io/npm/dt/node-red-contrib-esphome.svg)
![NPM Downloads per month](https://img.shields.io/npm/dm/node-red-contrib-esphome)
![Repo size](https://img.shields.io/github/repo-size/twocolors/node-red-contrib-esphome)

## About

### !!! Alpha, Alpha, Alpha release
### !!! Need help writing documentation

Node-RED nodes to ESPhome devices

## Prerequisites
Your ESPHome device must be configured with the ESPHome API enabled.

In your device.yaml configuration file:

```yaml
# Example configuration entry
api:
```

See [ESPHome documentation on api configuration](https://esphome.io/components/api.html) for more information.

## Network Optimization

⚠️ **Important**: To reduce network traffic and avoid "network spam":

1. **Optimized keepalive**: Default "Ping Interval" is set to 20 seconds for stable operation
2. **Auto-calculated reconnect**: Reconnect interval automatically calculated as 4.5× ping interval (90 seconds by default)
3. **Enhanced stability**: Added crash protection for invalid encryption keys
4. **Rate limiting**: State updates are throttled to prevent spam
5. **Monitor logs**: Check Node-RED logs for connection issues and adjust settings accordingly

### Recommended Settings for Network-Friendly Operation:
- **Ping Interval**: 20-60 seconds (default: 20)
- **Reconnect Interval**: Auto-calculated (4.5× ping interval, default: 90)
- **Log Level**: ERROR or WARN (avoid DEBUG/VERBOSE in production)

### New Features:
- **Crash Protection**: Invalid encryption keys no longer crash Node-RED
- **Rate Limiting**: State changes throttled to maximum 10Hz (100ms intervals)
- **ESPHome Compliance**: Timing follows ESPHome native API standards

## Installation

```bash
$ npm i node-red-contrib-esphome
```

## Inputs

Inputs are sent to the node as JSON payloads. The list below provides a list of keys and values (and their expected value type) that may be sent to the "esphome out" nodes. It is helpful to watch the "esphome in" messages to learn which type and range of commands are expected by your device.

Some example message payloads are:

```js
// to set a light on:
msg.payload = {'state': true}

// set a door lock to unlock:
msg.payload = {'command':0}

// to toggle a light to 42% brightness:
msg.payload = {'brightness': 42}

// to press a button:
msg.payload = true
```


#### Button

Button inputs may be triggered with any payload in the input message. Simply send a timestamp, `true`, or other payload to the button node. Button type nodes provide no messages into Node-RED.

#### Climate
  - `mode` - optional. 0 - OFF, 1 - AUTO, 2 - COOL, 3 - HEAT, 4 - FAN_ONLY, 5 - DRY.  See `supportedModesList` attr in config
  - `targetTemperature`- optional. float
  - `targetTemperatureLow`- optional. float
  - `targetTemperatureHigh`- optional. float
  - `legacyAway` - optional. Boolean. Deprecated: use `preset` with AWAY
  - `fanMode` - optional. 0 - ON, 1 - OFF, 2 - AUTO, 3 - LOW, 4 - MEDIUM, 5 - HIGH, 6 - MIDDLE, 7 - FOCUS, 8 - DIFFUSE, 9 - QUIET. See `supportedFanModesList` attr in config
  - `swingMode` - optional. 0 - OFF, 1 - BOTH, 2 - VERTICAL, 3 - HORIZONTAL. See `supportedSwingModesList` attr in config
  - `customFanMode` - optional. string. See `supportedCustomFanModesList` attr in config
  - `preset` - optional. 0 - NONE, 1 - HOME, 2 - AWAY, 3 - BOOST, 4 - COMFORT, 5 - ECO, 6 - SLEEP, 7 - ACTIVITY. See `supportedPresetsList` attr in config
  - `customPreset` - optional. string. See `supportedCustomPresetsList` attr in config
#### Cover
  - `legacyCommand` - optional. 0 - OPEN, 1 - CLOSE, 2 - STOP. Deprecated: use `position`
  - `position` - optional. float. 0.0 - CLOSED, 1.0 - OPEN. See `supportsPosition` attr in config
  - `tilt` - optional. float. 0.0 - CLOSED, 1.0 - OPEN. See `supportsTilt` attr in config
  - `stop` - optional. boolean
#### Fan
  - `state` - optional. boolean
  - `speed` - optional. 0 - LOW, 1 - MEDIUM, 2 - HIGH
  - `oscillating` - optional. boolean
  - `direction` - optional. 0 - FORWARD, 1 - REVERSE
  - `speedLevel` - optional. integer. See `supportedSpeedLevels` attr in config
#### Light
  - `state` - optional. boolean
  - `brightness` - optional. float
  - `red` - optional. integer 0-255
  - `green` - optional. integer 0-255
  - `blue` - optional. integer 0-255
  - `colorMode` - optional. integer. See `supportedColorModesList` attr in config
  - `colorBrightness` - optional. float
  - `white` - optional. integer 0-255
  - `colorTemperature` - optional. integer
  - `coldWhite` - optional. float
  - `warmWhite` - optional. float
  - `flashLength` - optional. integer
  - `effect` - optional. string. effect from effects array in config list
#### Lock
  - `command` - REQUIRED. 0 - UNLOCK, 1 - LOCK, 2 - OPEN
  - `code` - optional. string. See `requiresCode` attr in config
#### MediaPlayer
  - `command` - REQUIRED. 0 - MEDIA_PLAYER_COMMAND_PLAY, 1 - MEDIA_PLAYER_COMMAND_PAUSE, 2 - MEDIA_PLAYER_COMMAND_STOP, 3 - MEDIA_PLAYER_COMMAND_MUTE, 4 - MEDIA_PLAYER_COMMAND_UNMUTE
  - `volume` - optional. float
  - `mediaUrl` - optional. string
#### Number
  - `state` - REQUIRED. float. See `minValue`, `maxValue`, and `step` attrs in config
#### Select
  - `state` - REQUIRED. string. See `optionsList` attr in config
#### Siren
  - `state` - REQUIRED. boolean
  - `tone` - optional. string. See `tonesList` attr in config
  - `duration` - optional. integer. See `supportsDuration` attr in config
  - `volume` - optional. integer. See `supportsVolume` attr in config
#### Switch
  - `state` - REQUIRED. boolean
#### Text
  - `state` - REQUIRED. string. See `minLength`, `maxLength` attrs in config

## Pictures

<img src="https://github.com/twocolors/node-red-contrib-esphome/raw/main/readme/device.png">
<img src="https://github.com/twocolors/node-red-contrib-esphome/raw/main/readme/flow.png">
