import dbClient from '../utils/db'
import sha1 from 'sha1'

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body ? req.body : {'email': null, 'password': null}
    if (!email) {
      res.status(400)
      res.json({"error": "Missing email"})
      return
    }
    if (!password) {
      res.status(400)
      res.json({"error": "Missing password"})
      return
    }

    const user = await dbClient.getUserByEmail(email)
	  console.log(user)
    if (user) {
      res.status(400)
      res.json({"error": "Already exist"})
      return
    }

    const hashed_pwd =  sha1(password)

    const info = await dbClient.insertUser({'email': email, 'password': password})
    res.status(201)
    res.json({'id': info.insertedId, 'email': email})
  }
}


export default UsersController
