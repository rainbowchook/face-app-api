"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUsers = void 0;
const queries_1 = require("../services/queries");
const handleUsers = () => (req, res) => {
    (0, queries_1.getUsers)()
        .then((users) => res.json(users))
        .catch((error) => res.status(400).json(error));
};
exports.handleUsers = handleUsers;
