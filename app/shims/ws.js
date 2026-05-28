'use strict';
// React Native provides WebSocket globally — the Node.js ws package is not needed.
var WS = typeof WebSocket !== 'undefined' ? WebSocket : function() {};
if (WS) {
  WS.createWebSocketStream = function() { return null; };
  WS.WebSocketServer = function() { throw new Error('WebSocketServer not available in React Native'); };
  WS.WebSocket = WS;
}
module.exports = WS;
