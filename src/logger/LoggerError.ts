class CreateLoggerError extends Error {
    constructor(message = "") {
        super(message);

        this.name = "CreateLoggerError";
        this.message = message;
    }
}

export default CreateLoggerError;
