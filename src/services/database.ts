import knex, { Knex } from 'knex'

export interface User {
  id: string;
  name: string;
  email: string;
  entries: number;
  joined: Date;
}

export interface Login {
  id: string;
  email: string;
  hash: string;
}

const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL,
}

export const pg: Knex = knex({
  client: 'pg',
  connection: {
    connectionString: config.DATABASE_URL,
    host: config['DB_HOST'],
    port: config['DB_PORT'],
    user: config['DB_USER'],
    database: config['DB_NAME'],
    password: config['DB_PASSWORD'],
    // ssl: config["DB_SSL"] ? { rejectUnauthorized: false } : false,
  },
})

export { Knex } from 'knex'


// const usersQueryBuilder = pg.select('*').from('login')
// pg<User>('users').select('*')
// .then(data => console.log(data))
// if (true) {
//   // This select will not change the type of usersQueryBuilder
//   // We can not change the type of a pre-declared variable in TypeScript
//   usersQueryBuilder.select('email');
// }
// console.log(usersQueryBuilder)
// usersQueryBuilder
//   .then((login) => {
// Type of users here will be Pick<User, "id">[]
// which may not be what you expect.
//   console.log(login)
// })
// .catch((err) => console.log(err))

// You can specify the type of result explicitly through a second type parameter:
// const queryBuilder = pg<User, Pick<User, 'id' | 'email'>>('users')

// But there is no type constraint to ensure that these properties have actually been
// selected.

// So, this will compile:
// queryBuilder.select('name').then((users) => {
// Type of users is Pick<User, "id"> but it will only have name
// })