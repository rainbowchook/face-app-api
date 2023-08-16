"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUsers = void 0;
const queries_1 = require("../services/queries");
const handleUsers = () => (req, res) => {
    (0, queries_1.getUsers)()
        .then((users) => {
        // console.log(users)
        res.json(users);
    })
        .catch((error) => res.status(400).json(error));
    // const { users } = database
    // res.json(users)
    // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
};
exports.handleUsers = handleUsers;
// export const handleUsers = (pg: Knex) => (req: Request, res: Response) => {
//   pg<User>('users')
//     .select('*')
//     .then((users) => {
//       // console.log(users)
//       res.json(users)
//     })
//   // const { users } = database
//   // res.json(users)
//   // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
// }
