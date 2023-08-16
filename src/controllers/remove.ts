import { Request, Response } from 'express'
import { User, Login, Knex } from '../database'

const deleteUserById = (pg: Knex, id: string) => {
  try {
    const userToDelete = pg.transaction((trx) => {
      return trx<User, Pick<User, 'email'>>('users')
        .returning('email')
        .where({ id })
        .del()
        .then((email) => {
          return trx<Login, Pick<Login, 'email'>>('login').returning('email')
          .where({ email })
          .del()
        })
    })
    return userToDelete
  } catch (error) {
    console.error('Error deleting user data:', error)
    throw error
  }
}

const deleteUserByEmail = (pg: Knex, email: string) => {
  try {
    const userToDelete = pg<Login>('login')
      .returning('email')
      .where({ email })
      .join('login', 'login.email', 'users.email')
      .del()
    return userToDelete
  } catch (error) {
    console.error('Error deleting user data:', error)
    throw error
  }
}

export const handleRemoveUser = (pg: Knex) => (req: Request, res: Response) => {
  const { id } = req.params
  if (id) {
    deleteUserById(pg, id)
      .then((userData) => {
        console.log('User deleted:', userData)
        res.json(userData)
      })
      .catch((error) => {
        console.error('Error:', error)
        res.status(400).json('Error deleting')
      })
  } else {
    res.status(400).json('Unable to delete')
  }
}
