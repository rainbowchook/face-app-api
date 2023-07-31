"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const handleSignin = (pg) => (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        pg('login')
            .where({ email })
            .then((user) => {
            console.log(user);
            if (user[0]) {
                bcryptjs_1.default.compare(password, user[0].hash, (err, success) => {
                    if (success) {
                        const returnUser = Object.assign({}, user[0]);
                        delete returnUser.hash;
                        res.json(returnUser);
                    }
                    else {
                        console.log(err);
                        res.status(400).json('Invalid credentials');
                    }
                });
            }
            else {
                res.status(400).json('Incorrect email or password');
            }
        })
            .catch((err) => {
            console.log(err);
            res.status(400).json('Invalid email or password');
        });
    }
    else {
        res.status(400).json('error logging in');
    }
};
exports.handleSignin = handleSignin;
