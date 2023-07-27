"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImage = void 0;
const handleImage = (pg) => (req, res) => {
    const { id } = req.params;
    // pg<User, Pick<User, 'email' | 'entries'>>('users')
    pg('users')
        .where({ id })
        // .returning(['email', 'entries'])
        .increment('entries', 1)
        .returning('entries')
        .then((entries) => {
        console.log(entries);
        if (entries) {
            res.json(entries[0].entries);
        }
        else {
            res.status(400).json('Unable to update entries');
        }
    })
        .catch((err) => {
        console.log(err);
        res.status(400).json('Unable to get entries');
    });
};
exports.handleImage = handleImage;
