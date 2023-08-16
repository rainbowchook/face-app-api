import { pg, User, Login, Knex } from '../database'

export const getUsers = () => {
  return pg<User>('users')
    .select('*')
    .then((users) => {
      // console.log(users)
      return users
    })
    .catch((error) => {
      console.error('Error getting users', error)
      throw error
    })
}

export const getUserByID = (id: string) => {

}