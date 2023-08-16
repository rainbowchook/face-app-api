"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSigninOld = exports.handleSignin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUserDataByEmail = (pg, email) => {
    try {
        const userData = pg('users').where('users.email', '=', email);
        return userData;
    }
    catch (error) {
        console.error('Error retrieving user data:', error);
        throw error;
    }
};
const getUserAndLoginDataByEmail = (pg, email) => {
    try {
        const userData = pg
            .select()
            .from('users')
            .join('login', 'users.id', '=', 'login.id')
            .where('login.email', '=', email);
        return userData;
    }
    catch (error) {
        console.error('Error retrieving user data:', error);
        throw error;
    }
};
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
                        console.log('password correct', user[0]);
                        getUserDataByEmail(pg, user[0].email)
                            .then((userData) => {
                            console.log('User Data:', userData);
                            const returnUser = Object.assign({}, userData[0]);
                            // delete returnUser.hash
                            res.json(returnUser);
                        })
                            .catch((error) => {
                            console.error('Error:', error);
                            res.status(400).json('Error signing in');
                        });
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
const handleSigninOld = (pg) => (req, res) => {
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
exports.handleSigninOld = handleSigninOld;
