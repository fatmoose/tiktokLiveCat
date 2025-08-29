// connectionWrapper.js
const { WebcastPushConnection } = require('tiktok-live-connector');
const { EventEmitter } = require('events');

let globalConnectionCount = 0;

class TikTokConnectionWrapper extends EventEmitter {
    constructor(uniqueId, options, enableLog) {
        super();
        this.uniqueId = uniqueId;
        this.enableLog = enableLog;

        this.clientDisconnected = false;
        this.reconnectEnabled = true;
        this.reconnectCount = 0;
        this.reconnectWaitMs = 1000;
        this.maxReconnectAttempts = 10; // Increased attempts
        this.lastConnectedTime = null;
        this.connectionStableThreshold = 30000; // 30 seconds of stable connection

        this.connection = new WebcastPushConnection(uniqueId, options);

        this.connection.on('streamEnd', () => {
            this.log(`streamEnd event received, giving up connection`);
            this.reconnectEnabled = false;
        });

        this.connection.on('disconnected', () => {
            globalConnectionCount -= 1;
            this.log(`TikTok connection disconnected`);
            this.scheduleReconnect();
        });

        this.connection.on('error', (err) => {
            this.log(`Error event triggered: ${err.info}, ${err.exception}`);
            
            // Handle specific error types
            if (err.exception && err.exception.code === 'ECONNRESET') {
                this.log(`Connection reset by peer - scheduling reconnect`);
                this.scheduleReconnect('Connection reset by TikTok server');
            } else if (err.exception && err.exception.code === 'ENOTFOUND') {
                this.log(`DNS resolution failed - network issue`);
                this.scheduleReconnect('Network connectivity issue');
            } else if (err.exception && err.exception.code === 'ETIMEDOUT') {
                this.log(`Connection timeout - scheduling reconnect`);
                this.scheduleReconnect('Connection timeout');
            } else {
                this.log(`Unhandled error: ${err.exception?.code || 'Unknown'}`);
                // For unknown errors, still try to reconnect but with a longer delay
                setTimeout(() => {
                    this.scheduleReconnect('Unknown connection error');
                }, 5000);
            }
        });
    }

    connect(isReconnect) {
        this.connection.connect().then((state) => {
            this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}, websocket: ${state.upgradedToWebsocket}`);

            globalConnectionCount += 1;
            this.lastConnectedTime = Date.now();

            // Reset reconnect parameters based on connection stability
            const connectionWasStable = this.lastConnectedTime && 
                (Date.now() - this.lastConnectedTime) > this.connectionStableThreshold;
            
            if (connectionWasStable || !isReconnect) {
                this.reconnectCount = 0;
                this.reconnectWaitMs = 1000;
            } else {
                // Don't reset counters for quick reconnections
                this.log(`Quick reconnection - maintaining backoff strategy`);
            }

            if (this.clientDisconnected) {
                this.connection.disconnect();
                return;
            }

            if (!isReconnect) {
                this.emit('connected', state);
            }

        }).catch((err) => {
            this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed, ${err}`);

            if (isReconnect) {
                this.scheduleReconnect(err);
            } else {
                this.emit('disconnected', err.toString());
            }
        });
    }

    scheduleReconnect(reason) {
        if (!this.reconnectEnabled) {
            return;
        }

        if (this.reconnectCount >= this.maxReconnectAttempts) {
            this.log(`Give up connection, max reconnect attempts exceeded`);
            this.emit('disconnected', `Connection lost. ${reason}`);
            return;
        }

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 1000;
        const waitTime = Math.min(this.reconnectWaitMs + jitter, 30000); // Cap at 30 seconds
        
        this.log(`Try reconnect in ${Math.round(waitTime)}ms (attempt ${this.reconnectCount + 1}/${this.maxReconnectAttempts}) - Reason: ${reason}`);

        setTimeout(() => {
            if (!this.reconnectEnabled || this.reconnectCount >= this.maxReconnectAttempts) {
                return;
            }

            this.reconnectCount += 1;
            
            // Exponential backoff with jitter, but less aggressive for network errors
            const reasonStr = reason ? reason.toString() : '';
            if (reasonStr.includes('reset')) {
                this.reconnectWaitMs = Math.min(this.reconnectWaitMs * 1.5, 10000); // Gentler backoff for resets
            } else {
                this.reconnectWaitMs = Math.min(this.reconnectWaitMs * 2, 30000); // Standard backoff
            }
            
            this.connect(true);

        }, waitTime);
    }

    disconnect() {
        this.log(`Client connection disconnected`);

        this.clientDisconnected = true;
        this.reconnectEnabled = false;

        if (this.connection.getState().isConnected) {
            this.connection.disconnect();
        }
    }

    // Manual reset method for severe issues
    forceReconnect() {
        this.log(`Force reconnect requested`);
        
        if (this.connection.getState().isConnected) {
            this.connection.disconnect();
        }
        
        // Reset connection state
        this.reconnectCount = 0;
        this.reconnectWaitMs = 1000;
        this.reconnectEnabled = true;
        
        // Wait a moment then reconnect
        setTimeout(() => {
            this.connect(true);
        }, 2000);
    }

    // Get connection health info
    getConnectionInfo() {
        const state = this.connection.getState();
        return {
            isConnected: state.isConnected,
            reconnectCount: this.reconnectCount,
            lastConnected: this.lastConnectedTime,
            maxAttempts: this.maxReconnectAttempts,
            nextWaitTime: this.reconnectWaitMs
        };
    }

    log(logString) {
        if (this.enableLog) {
            console.log(`WRAPPER @${this.uniqueId}: ${logString}`);
        }
    }
}

module.exports = {
    TikTokConnectionWrapper,
    getGlobalConnectionCount: () => globalConnectionCount
};
