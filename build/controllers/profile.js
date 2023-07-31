"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfile = void 0;
const handleProfile = (pg) => (req, res) => {
    const { id } = req.params;
    // const { users } = database
    pg('users')
        .select('*')
        .where({ id })
        .then((user) => {
        console.log(user);
        if (user && user.length) {
            res.json(user[0]);
        }
        else {
            res.status(400).json('Not found');
        }
    })
        .catch((err) => res.status(500).json('Unable to find user ' + err));
};
exports.handleProfile = handleProfile;
