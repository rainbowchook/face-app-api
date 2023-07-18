"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.options('*', (0, cors_1.default)());
const corsOptions = {
    origin: true,
    optionsSuccessStatus: 200,
};
app.get('/', (0, cors_1.default)(corsOptions), (req, res) => {
    const { users } = database_1.database;
    res.json(users);
    // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
});
app.post('/signin', (0, cors_1.default)(corsOptions), (req, res) => {
    const { email, password } = req.body;
    const { users } = database_1.database;
    if (email && password) {
        const user = users.find((user) => user.email === email);
        if (user) {
            bcryptjs_1.default.compare(password, user.password, (err, success) => {
                if (success) {
                    res.json(user);
                }
                else {
                    console.log(err);
                    res.status(400).json('Invalid credentials');
                }
            });
        }
        else {
            res.json('Incorrect email or password');
        }
    }
    else {
        res.status(400).json('error logging in');
    }
    // res.json('signin is working')
});
app.post('/register', (0, cors_1.default)(corsOptions), (req, res) => {
    const { name, email, password } = req.body;
    const { users } = database_1.database;
    if (name && email && password) {
        bcryptjs_1.default.hash(password, 10, (err, hash) => {
            if (err) {
                res.status(400).json('Cannot register with this password ' + err);
            }
            //Store hash password in DB
            console.log(hash);
            const newUser = {
                id: String(Number(users[users.length - 1].id) + 1),
                name,
                email,
                password: hash,
                entries: 0,
                joined: new Date(),
            };
            const user = users.push(newUser);
            if (!user) {
                res.status(400).json('Unable to register');
            }
            const returnedUser = Object.assign({}, newUser);
            delete returnedUser.id;
            res.status(201).json(returnedUser);
            //or return the last item in the array: res.json(users[users.length - 1])
        });
    }
    else {
        res.status(400).json('Invalid credentials');
    }
});
app.get('/profile/:id', (0, cors_1.default)(corsOptions), (req, res) => {
    const { id } = req.params;
    const { users } = database_1.database;
    const user = users.find((user) => user.id === id);
    if (user) {
        res.json(user);
    }
    else {
        res.status(404).json('user not found');
    }
});
app.put('/image', (0, cors_1.default)(corsOptions), (req, res) => {
    const { id } = req.body;
    const { users } = database_1.database;
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex >= 0) {
        users[userIndex].entries++;
        res.status(201).json(users[userIndex]);
    }
    else {
        res.status(400).json('Unable to update user entries');
    }
});
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
console.log('hi there');
/*
/ -> GET res = this is working
/signin -> POST = success/fail
/register -> POST = user
/profile/:userId -> GET = user
/image -> PUT = user

TODOs:
/profile/:userId -> PUT = user
/profile/:userId -> DELETE = success/fail
*/
