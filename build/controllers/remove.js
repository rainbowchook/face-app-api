"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRemoveUser = void 0;
const deleteUserById = (pg, id) => {
    try {
        const userToDelete = pg.transaction((trx) => {
            return trx('users')
                .returning('email')
                .where({ id })
                .del()
                .then((email) => {
                return trx('login').returning('email')
                    .where({ email })
                    .del();
            });
        });
        return userToDelete;
    }
    catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};
const deleteUserByEmail = (pg, email) => {
    try {
        const userToDelete = pg('login')
            .returning('email')
            .where({ email })
            .join('login', 'login.email', 'users.email')
            .del();
        return userToDelete;
    }
    catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};
const handleRemoveUser = (pg) => (req, res) => {
    const { id } = req.params;
    if (id) {
        deleteUserById(pg, id)
            .then((userData) => {
            console.log('User deleted:', userData);
            res.json(userData);
        })
            .catch((error) => {
            console.error('Error:', error);
            res.status(400).json('Error deleting');
        });
    }
    else {
        res.status(400).json('Unable to delete');
    }
};
exports.handleRemoveUser = handleRemoveUser;
