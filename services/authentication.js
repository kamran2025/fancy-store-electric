import JWT from "jsonwebtoken";
// import googleAuth from '../googlAuth';
import dotenv from 'dotenv';
dotenv.config();


const secret = process.env.PASSWORD_SECRET;

function createUserToken(user) {
  try {
    if(user) {
    const payload = {
      email: user.get('email'),
      role: user.get('role'),
    }
    const expiresIn = 4 * 60 * 60;
    const token = JWT.sign(payload,secret, {expiresIn});
    return token;
  }
  } catch (error) {
    console.log(error)
  }
}

function validateToken(token) {
  const payload = JWT.verify(token,secret);
  return payload;
}

export {
  createUserToken,
  validateToken,
}