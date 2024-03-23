import googleAuth from "../googlAuth.js";
import { createHmac } from 'crypto'
import { createUserToken } from "../services/authentication.js";

const { userData } = await googleAuth();

async function getUserByEmailAndPasswordWithToken(email, password) {
  try {
    const allUsers = await userData.getRows();
    const getUser = allUsers.find(user => user.get('email') === email
      );

    const salt = getUser.get('salt');
    const userProvidedHash = createHmac('sha256', salt)
      .update(password)
      .digest("hex");

      const user = allUsers.find(user => user.get('email') === email && user.get('password') === userProvidedHash)

      const token = createUserToken(user);
      return token;

  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export {
  getUserByEmailAndPasswordWithToken,
}