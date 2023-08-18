import { Request, Response } from 'express'
import { updateUserEntriesById } from '../services'

export const handleImage = () => (req: Request, res: Response) => {
  const { id } = req.params
  updateUserEntriesById(id)
    .then((user) => res.json(user[0].entries))
    .catch((error) => res.status(400).json(error))
}
