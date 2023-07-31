"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUsers = void 0;
const handleUsers = (pg) => (req, res) => {
    pg('users')
        .select('*')
        .then((users) => {
        // console.log(users)
        res.json(users);
    });
    // const { users } = database
    // res.json(users)
    // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
};
exports.handleUsers = handleUsers;
