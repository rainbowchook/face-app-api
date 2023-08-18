import { Request, Response } from 'express'
import { getUserByID } from '../services'

export const handleProfile = () => (req: Request, res: Response) => {
  const { id } = req.params
  getUserByID(id)
    .then((user) => res.json(user))
    .catch((error) => res.status(500).json('Unable to find user: ' + error))
}