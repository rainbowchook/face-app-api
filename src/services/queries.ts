import { pg, User, Login, Knex } from '../database'

export const getUsers = () => {
  return pg<User>('users')
    .select('*')
    .then((users) => users)
    .catch((error) => {
      console.error('Error getting users', error)
      throw error
    })
}

export const getUserByID = (id: string) => {
  return pg<User, Pick<User, keyof User>>('users')
    .where({ id })
    .then((user) => user)
    .catch((error) => {
      console.error('Error retrieving user data:', error)
      throw error
    })
}

export const getUserByEmail = (email: string) => {
  return pg<User>('users')
    .where('users.email', '=', email)
    .then((user) => user)
    .catch((error) => {
      console.error('Error retrieving user data:', error)
      throw error
    })
}

export const getLoginByEmail = (email: string) => {
  return (
    pg
      .select()
      .from<Login>('login')
      .where({ email })
      // .join('login', 'users.id', '=', 'login.id')
      // .where('login.email', '=', email)
      .then((login) => login)
      .catch((error) => {
        console.error('Error retrieving user data:', error)
        throw error
      })
  )
}

export const getLoginPasswordByEmail = (email: string) => {
  return (
    pg
      .select()
      .from<Login>('login')
      .where({ email })
      .returning('hash')
      // .join('login', 'users.id', '=', 'login.id')
      // .where('login.email', '=', email)
      .then((loginPassword) => loginPassword)
      .catch((error) => {
        console.error('Error retrieving user data:', error)
        throw error
      })
  )
}
