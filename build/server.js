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
const knex_1 = __importDefault(require("knex"));
const config = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT),
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_SSL: process.env.DB_SSL,
};
const pg = (0, knex_1.default)({
    client: 'pg',
    connection: {
        connectionString: config.DATABASE_URL,
        host: config['DB_HOST'],
        port: config['DB_PORT'],
        user: config['DB_USER'],
        database: config['DB_NAME'],
        password: config['DB_PASSWORD'],
        // ssl: config["DB_SSL"] ? { rejectUnauthorized: false } : false,
    },
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.options('*', (0, cors_1.default)());
const corsOptions = {
    origin: true,
    optionsSuccessStatus: 200,
};
app.get('/', (0, cors_1.default)(corsOptions), (req, res) => {
    pg('users')
        .select('*')
        .then((users) => {
        console.log(users);
        res.json(users);
    });
    // const { users } = database
    // res.json(users)
    // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
});
app.post('/signin', (0, cors_1.default)(corsOptions), (req, res) => {
    const { email, password } = req.body;
    const { users, logins } = database_1.database;
    if (email && password) {
        // const user: User | undefined = users.find(
        //   (user) => user.email === email
        // )
        pg('login')
            .where({ email })
            .then((user) => {
            console.log(user);
            if (user[0]) {
                bcryptjs_1.default.compare(password, user[0].hash, (err, success) => {
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
                res.status(400).json('Incorrect email or password');
            }
        })
            .catch((err) => {
            console.log(err);
            res.status(400).json('Invalid email or password');
        });
        // if (user) {
        //   bcrypt.compare(password, user.password, (err, success) => {
        //     if(success) {
        //       res.json(user)
        //     } else {
        //       console.log(err)
        //       res.status(400).json('Invalid credentials')
        //     }
        //   })
        // } else {
        //   res.json('Incorrect email or password')
        // }
    }
    else {
        res.status(400).json('error logging in');
    }
    // res.json('signin is working')
});
// app.post(
//   '/signin',
//   cors(corsOptions),
//   (req: RequestWithBody, res: Response) => {
//     const { email, password } = req.body
//     const { logins } = database
//     if (email && password) {
//       const user: Login | undefined = logins.find(
//         (user) => user.email === email && user.hash === password
//       )
//       if (user) {
//         res.json(user)
//       } else {
//         res.json('Incorrect email or password')
//       }
//     } else {
//       res.status(400).json('error logging in')
//     }
//     // res.json('signin is working')
//   }
// )
app.post('/register', (0, cors_1.default)(corsOptions), (req, res) => {
    const { name, email, password } = req.body;
    // const { users, logins } = database
    if (name && email && password) {
        bcryptjs_1.default.hash(password, 10, (err, hash) => {
            if (err) {
                res.status(400).json('Could not register: ' + err);
            }
            // try {
            //Store hash password in DB
            console.log(hash);
            pg('users')
                .returning('*')
                // .returning(['name', 'email', 'entries', 'joined'])
                .insert({
                name,
                email,
                joined: new Date(),
            })
                .then((users) => {
                console.log(users);
                res.status(201).json(users[0]);
            })
                .catch((error) => {
                console.log(error);
                res.status(400).json(error);
            });
            // const id = String(Number(users[users.length - 1].id) + 1)
            // const newUser: User = {
            //   id,
            //   name,
            //   email,
            //   entries: 0,
            //   joined: new Date(),
            // }
            // const newLogin: Login = {
            //   id,
            //   email,
            //   hash
            // }
            // users.push(newUser)
            // logins.push(newLogin)
            // const returnedUser = { ...newUser } as Partial<User>
            // delete returnedUser.id
            // res.status(201).json(returnedUser)
            //or return the last item in the array: res.json(users[users.length - 1])
            // } catch (err) {
            //   res.status(400).json('Could not register: ' + err)
            // }
        });
    }
    else {
        res.status(400).json('Invalid credentials');
    }
});
app.get('/profile/:id', (0, cors_1.default)(corsOptions), (req, res) => {
    const { id } = req.params;
    // const { users } = database
    pg('users')
        .select('*')
        .where({ id })
        .then((user) => {
        console.log(user);
        if (user && user.length) {
            res.json(user[0]);
        }
        else {
            res.status(400).json('Not found');
        }
    })
        .catch((err) => res.status(500).json('Unable to find user ' + err));
    // const user: User | undefined = users.find((user) => user.id === id)
    // if (user) {
    //   res.json(user)
    // } else {
    //   res.status(404).json('user not found')
    // }
});
app.put('/image', (0, cors_1.default)(corsOptions), (req, res) => {
    const { id } = req.body;
    // pg<User, Pick<User, 'email' | 'entries'>>('users')
    pg('users')
        .where({ id })
        // .returning(['email', 'entries'])
        .increment('entries', 1)
        .returning('entries')
        .then((entries) => {
        console.log(entries);
        if (entries) {
            res.json(entries[0].entries);
        }
        else {
            res.status(400).json('Unable to update entries');
        }
    })
        .catch((err) => {
        console.log(err);
        res.status(400).json('Unable to get entries');
    });
    // const { users } = database
    // const userIndex: number = users.findIndex((user) => user.id === id)
    // if (userIndex >= 0) {
    //   users[userIndex].entries++
    //   res.status(201).json(users[userIndex])
    // } else {
    //   res.status(400).json('Unable to update user entries')
    // }
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
