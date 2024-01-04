class Util {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static waitForCondition(condition: () => boolean, timeoutError: any, timeout = 60000, interval = 100) {
        return new Promise<void>((resolve, reject) => {
            let _timeout: NodeJS.Timeout;

            if (timeout >= 0) {
                _timeout = setTimeout(() => reject(timeoutError), timeout);
            }

            setInterval(() => {
                if (condition()) {
                    if (_timeout) {
                        clearTimeout(_timeout);
                    }

                    resolve();
                }
            }, interval);
        });
    }
}

export default Util;
