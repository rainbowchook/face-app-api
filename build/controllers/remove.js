"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRemoveUser = void 0;
const services_1 = require("../services");
const handleRemoveUser = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.deleteUserById)(id)
        .then((userData) => {
        console.log('User deleted:', userData);
        res.json(userData);
    })
        .catch((error) => {
        console.error('Error:', error);
        res.status(400).json('Error deleting');
    });
};
exports.handleRemoveUser = handleRemoveUser;
