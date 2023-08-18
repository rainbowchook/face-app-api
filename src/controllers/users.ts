import { Request, Response } from 'express'
import { getUsers } from '../services/queries'

export const handleUsers = () => (req: Request, res: Response) => {
  getUsers()
    .then((users) => res.json(users))
    .catch((error) => res.status(400).json(error))
}
