export const validateJoiSchema = function (joiSchema) {
    return (req, res, next) => {
        const { value, error } = joiSchema.validate(req.body, { abortEarly: false });
        if (error) {
         
            next({ status: 400, type: 'validation', msg: error.message });
       
        }
        else {
            req.body = value;
            next();
        }
    };
};
