"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegister = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const handleRegister = (pg) => (req, res) => {
    const { name, email, password } = req.body;
    if (name && email && password) {
        bcryptjs_1.default.hash(password, 10, (err, hash) => {
            if (err) {
                res.status(400).json('Could not register: ' + err);
            }
            //Store hash password in DB
            pg.transaction((trx) => {
                return trx
                    .insert({ hash, email })
                    .into('login')
                    .returning('email')
                    .then((loginEmail) => {
                    return (trx('users')
                        .returning('*')
                        // .returning(['name', 'email', 'entries', 'joined'])
                        .insert({
                        name,
                        email: loginEmail[0].email,
                        joined: new Date(),
                    })
                        .then((users) => {
                        // console.log(users)
                        res.status(201).json(users[0]);
                    }));
                })
                    .then(trx.commit)
                    .catch(trx.rollback);
            }).catch((error) => res.status(400).json(error));
        });
    }
    else {
        res.status(400).json('Unable to register');
    }
};
exports.handleRegister = handleRegister;
