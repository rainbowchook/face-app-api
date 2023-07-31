import { Request, Response } from "express"
import { User, Knex } from '../database'

export const handleProfile = (pg: Knex) => (req: Request, res: Response) => {
  const { id } = req.params
  // const { users } = database
  pg<User>('users')
    .select('*')
    .where({ id })
    .then((user) => {
      console.log(user)
      if (user && user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch((err) => res.status(500).json('Unable to find user ' + err))
}