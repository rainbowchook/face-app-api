import { Request, Response } from 'express'
import { deleteUserById } from '../services'

export const handleRemoveUser = () => (req: Request, res: Response) => {
  const { id } = req.params
  deleteUserById(id)
    .then((userData) => res.json(userData[0]))
    .catch((error) => res.status(400).json(error))
}
