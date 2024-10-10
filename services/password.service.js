const bcrypt = require('bcrypt');

const saltRounds = 10;

const hashPassword = async (password) => {
    console.log("HASHPASSWORD: ", password);
    try {
        return await bcrypt.hash(password, saltRounds);
    } catch (err) {
        console.error('Error hashing password:', err);
        throw new Error('Password hashing failed');
    }
};

const comparePassword = async (plainPassword, hashedPassword) => {
    console.log("COMPAREPASSWORD:", plainPassword, hashedPassword);
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
        console.error('Error comparing passwords:', err);
        return false;
    }
};

module.exports = {
    hashPassword,
    comparePassword
};