const Joi = require('joi');

function validate(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.query);
        if (error) {
            const err = new Error(error.details[0].message);
            err.statusCode = 400;
            return next(err);
        }
        next();
    };
}

module.exports = validate;