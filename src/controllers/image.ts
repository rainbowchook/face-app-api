import { Response } from "express"
import { RequestWithBody } from "../server"
import { User, Knex } from '../database'

export const handleImage = (pg: Knex) => (req: RequestWithBody, res: Response) => {
  const { id } = req.body
  // pg<User, Pick<User, 'email' | 'entries'>>('users')
  pg<User, Pick<User, 'entries'>>('users')
    .where({ id })
    // .returning(['email', 'entries'])
    .increment('entries', 1)
    .returning('entries')
    .then((entries) => {
      console.log(entries)
      if (entries) {
        res.json(entries[0].entries)
      } else {
        res.status(400).json('Unable to update entries')
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(400).json('Unable to get entries')
    })
}