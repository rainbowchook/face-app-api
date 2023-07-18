export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  entries: number;
  joined: Date;
}

interface Database {
  users: User[]
}

export const database: Database = {
  users: [
    {
      id: '123',
      name: 'Cookie Monster',
      email: 'cookie@monsters.com',
      password: 'pass123',
      entries: 2,
      joined: new Date()
    },
    {
      id: '124',
      name: 'Elmo',
      email: 'elmo@monsters.com',
      password: 'pass123',
      entries: 1,
      joined: new Date()
    }
  ]
}