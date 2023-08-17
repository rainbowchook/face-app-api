"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImage = void 0;
const services_1 = require("../services");
const handleImage = () => (req, res) => {
    const { id } = req.params;
    (0, services_1.updateUserEntriesById)(id)
        .then((user) => res.json(user[0].entries))
        .catch((error) => res.status(400).json('Error getting user entries count'));
};
exports.handleImage = handleImage;
// export const handleImageOld = (pg: Knex) => (req: Request, res: Response) => {
//   const { id } = req.params
//   // pg<User, Pick<User, 'email' | 'entries'>>('users')
//   pg<User, Pick<User, 'entries'>>('users')
//     .where({ id })
//     // .returning(['email', 'entries'])
//     .increment('entries', 1)
//     .returning('entries')
//     .then((user) => {
//       console.log(user)
//       if (user) {
//         res.json(user[0].entries)
//       } else {
//         res.status(400).json('Unable to update entries')
//       }
//     })
//     .catch((err) => {
//       console.log(err)
//       res.status(400).json('Unable to get entries')
//     })
// }
