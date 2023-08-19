"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const queries_1 = require("../services/queries");
const handleSignin = () => (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        (0, queries_1.getLoginByEmail)(email)
            .then((user) => {
            if (user.length && user[0]) {
                bcryptjs_1.default.compare(password, user[0].hash, (err, success) => {
                    if (success) {
                        console.log('after getLoginByEmail, before getUserByEmail', user[0].email);
                        (0, queries_1.getUserByEmail)(user[0].email)
                            .then((userData) => {
                            console.log('after getLoginByEmail, after getUserByEmail, in then block', user[0].email, userData);
                            userData.length && userData[0]
                                ? res.json(userData[0])
                                : res
                                    .status(500)
                                    .json(`User email ${email} does not exist for this login`);
                        })
                            .catch((error) => {
                            console.error('Error:', error);
                            throw new Error('Error signing in:' + error);
                        });
                    }
                    else {
                        console.error(err);
                        res.status(400).json('Invalid credentials:' + err);
                    }
                });
            }
            else {
                res.status(400).json('Incorrect email or password');
            }
        })
            .catch((error) => res.status(400).json(error));
    }
    else {
        res.status(400).json('Error: Please enter Email and Password');
    }
};
exports.handleSignin = handleSignin;
