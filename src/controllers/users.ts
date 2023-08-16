import { Request, Response } from 'express'
import { User, Knex } from '../database'
import { getUsers } from '../services/queries'

export const handleUsers = () => (req: Request, res: Response) => {
  getUsers()
    .then((users) => {
      // console.log(users)
      res.json(users)
    })
    .catch((error) => res.status(400).json(error))
  // const { users } = database
  // res.json(users)
  // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
}

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
