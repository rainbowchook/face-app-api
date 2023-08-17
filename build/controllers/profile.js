"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfile = void 0;
const services_1 = require("../services");
const handleProfile = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.getUserByID)(id)
        .then((user) => res.json(user))
        .catch((err) => res.status(500).json('Unable to find user ' + err));
};
exports.handleProfile = handleProfile;
// export const handleProfileOld = (pg: Knex) => (req: Request, res: Response) => {
//   const { id } = req.params
//   // const { users } = database
//   pg<User>('users')
//     .select('*')
//     .where({ id })
//     .then((user) => {
//       console.log(user)
//       if (user && user.length) {
//         res.json(user[0])
//       } else {
//         res.status(400).json('Not found')
//       }
//     })
//     .catch((err) => res.status(500).json('Unable to find user ' + err))
// }
