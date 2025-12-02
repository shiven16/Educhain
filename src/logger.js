// The actual logger implementation
function createLogger(name) {
    const log = (formatter, ...args) => {
        if (typeof formatter === 'string') {
            console.log(`[${name}] ${formatter}`, ...args);
        } else {
            console.log(`[${name}]`, formatter, ...args);
        }
    };

    log.error = (formatter, ...args) => {
        if (typeof formatter === 'string') {
            console.error(`[${name}] ${formatter}`, ...args);
        } else {
            console.error(`[${name}]`, formatter, ...args);
        }
    };

    log.trace = log;
    log.enabled = true;

    return log;
}

// The factory creator expected by libp2p configuration
export function logger() {
    return (components) => createLogger;
}

export const defaultLogger = createLogger;
