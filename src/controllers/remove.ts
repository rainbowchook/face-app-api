import { Request, Response } from 'express'
import { User, Login, Knex } from '../database'
import { deleteUserById } from '../services'

export const handleRemoveUser = () => (req: Request, res: Response) => {
  const { id } = req.params
  deleteUserById(id)
    .then((userData) => {
      console.log('User deleted:', userData)
      res.json(userData)
    })
    .catch((error) => {
      console.error('Error:', error)
      res.status(400).json('Error deleting')
    })
}
