"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
exports.database = {
    users: [
        {
            id: '123',
            name: 'Cookie Monster',
            email: 'cookie@monsters.com',
            entries: 2,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Elmo',
            email: 'elmo@monsters.com',
            entries: 1,
            joined: new Date()
        }
    ],
    logins: [
        {
            id: '123',
            email: 'cookie@monsters.com',
            hash: 'pass123',
        },
        {
            id: '124',
            email: 'elmo@monsters.com',
            hash: 'pass123',
        }
    ]
};
