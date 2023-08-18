"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRemoveUser = void 0;
const services_1 = require("../services");
const handleRemoveUser = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.deleteUserById)(id)
        .then((userData) => res.json(userData[0]))
        .catch((error) => res.status(400).json(error));
};
exports.handleRemoveUser = handleRemoveUser;
