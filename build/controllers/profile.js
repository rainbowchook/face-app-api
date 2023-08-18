"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfile = void 0;
const services_1 = require("../services");
const handleProfile = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.getUserByID)(id)
        .then((user) => res.json(user))
        .catch((error) => res.status(500).json('Unable to find user: ' + error));
};
exports.handleProfile = handleProfile;
