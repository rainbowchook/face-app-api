import { Request, Response, IRouterHandler } from 'express'
import { User, Knex } from '../database'

export const handleUsers = (pg: Knex) => (req: Request, res: Response) => {
  pg<User>('users')
    .select('*')
    .then((users) => {
      // console.log(users)
      res.json(users)
    })
  // const { users } = database
  // res.json(users)
  // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
}
