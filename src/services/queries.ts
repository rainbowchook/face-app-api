import { pg, User, Login } from '../database'

export const getUsers = () => {
  return pg<User>('users')
    .select('*')
    .then((users) => users)
    .catch((error) => {
      console.error('Error getting users: ', error)
      throw new Error('Error getting users')
    })
}

export const getUserByID = (id: string) => {
  return pg<User, Pick<User, keyof User>>('users')
    .where({ id })
    .then((user) => user)
    .catch((error) => {
      console.error('Error retrieving user data: ', error)
      throw new error()
    })
}

export const getUserByEmail = (email: string) => {
  return pg<User>('users')
    .where('users.email', '=', email)
    .then((user) => user)
    .catch((error) => {
      console.error('Error retrieving user data: ', error)
      throw error
    })
}

export const getLoginByEmail = (email: string) => {
  return pg<Login>('login')
    .where({ email })
    .then((login) => login)
    .catch((error) => {
      console.error('Error retrieving user data: ', error)
      throw error
    })
}

export const getLoginHashByEmail = (email: string) => {
  return pg
    .select()
    .from<Login, Pick<Login, 'hash'>>('login')
    .where({ email })
    .returning('hash')
    .then((loginPassword) => loginPassword)
    .catch((error) => {
      console.error('Error retrieving user data: ', error)
      throw error
    })
}

export const createUserAndLogin = (
  hash: string,
  name: string,
  email: string
) => {
  return pg
    .transaction((trx) => {
      return trx
        .insert({ hash, email })
        .into<Login, Pick<Login, 'email'>>('login')
        .returning('email')
        .then((loginEmail) => {
          return trx
            .insert({
              name,
              email: loginEmail[0].email,
              joined: new Date(),
            })
            .into<User, Pick<User, keyof User>>('users')
            .returning('*')
        })
    })
    .then((users) => users)
    .catch((error) => {
      console.error('Error inserting user: ', error)
      throw error
    })
}

export const updateUserEntriesById = (id: string) => {
  return pg<User, Pick<User, 'entries'>>('users')
    .where({ id })
    .increment('entries', 1)
    .returning('entries')
    .then((user) => user)
    .catch((err) => {
      console.error('Error updating user entries count: ', err)
      throw err
    })
}

export const deleteUserById = (id: string) => {
  return pg
    .transaction((trx) => {
      return trx
        .from<User, Pick<User, 'email'>>('users')
        .where({ id })
        .del()
        .returning('email')
        .then((user) => {
          return trx<Login, Pick<Login, 'email'>>('login')
            .where({ email: user[0].email })
            .del()
            .returning('email')
        })
    })
    .then((userToDelete) => userToDelete)
    .catch((error) => {
      console.error('Error deleting user data:', error)
      throw error
    })
}
