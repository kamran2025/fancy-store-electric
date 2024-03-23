import { validateToken } from "../services/authentication.js";

function isCookie(cookieName) {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];

    if(!tokenCookieValue) {
      return next()
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {
      console.log(error)
    }
    return next();
  }
}


function isAdmin(req, res, next) {
  const userRole = req.user?.role; 

  if (userRole === 'ADMIN') {
   return next();

  } else {
    res.redirect('/'); 
  }
}


export {
  isCookie,
  isAdmin,
}