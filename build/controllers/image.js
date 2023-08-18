"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImage = void 0;
const services_1 = require("../services");
const handleImage = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.updateUserEntriesById)(id)
        .then((user) => res.json(user[0].entries))
        .catch((error) => res.status(400).json(error));
};
exports.handleImage = handleImage;
