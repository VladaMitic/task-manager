const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ','');//uzimamo token iz headera
        const decoded = jwt.verify(token, process.env.JWT_SECRET);//verifikujemo token, kako bi dobili signature, a time i usera (jer nam treba id). Nema kolback funkcije pri verifikaciji kao treceg argumenta
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token })//trazimo usera po id-u koji smo dobili dekodovanje JWT, ali trazimo i da zadovoljava uslov da se u areju storidzovanih tokena nalzai i token koji je poslat
        if (!user) {
            throw new Error(); //ovo ce trigerovati catchdole, ne mor aporuka, kositice poruku koja je u catchu
        }

        req.token = token; 
        req.user = user; //ubacuje se user u request (ako je autentikovan)
        next();
    } catch (err) {
        res.status(401).send('Please authenticate!');
    }
}

module.exports = auth;