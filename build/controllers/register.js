"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegister = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const queries_1 = require("../services/queries");
const handleRegister = () => (req, res) => {
    const { name, email, password } = req.body;
    if (name && email && password) {
        bcryptjs_1.default.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(400).json('Could not register: ' + err);
            }
            //Store hash password in DB
            (0, queries_1.createUserAndLogin)(hash, name, email)
                .then((users) => res.status(201).json(users[0]))
                .catch((error) => res.status(400).json(error));
        });
    }
    else {
        res.status(400).json('Error: Please enter Name, Email and Password');
    }
};
exports.handleRegister = handleRegister;
