import { Request, Response } from 'express'
import { User, Knex } from '../database'
import { getUserByID } from '../services'

export const handleProfile = () => (req: Request, res: Response) => {
  const { id } = req.params
  getUserByID(id)
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json('Unable to find user ' + err))
}

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
