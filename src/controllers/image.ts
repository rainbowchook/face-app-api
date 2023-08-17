import { Request, Response } from 'express'
import { User, Knex } from '../database'
import { updateUserEntriesById } from '../services'

export const handleImage = () => (req: Request, res: Response) => {
  const { id } = req.params
  updateUserEntriesById(id)
    .then((user) => res.json(user[0].entries))
    .catch((error) => res.status(400).json('Error getting user entries count'))
}

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
