import { MongoClient } from 'mongodb'


class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost'
    const port = process.env.DB_PORT || 27017
    const db = process.env.DB_DATABASE || 'files_manager'
    
    const url = `mongodb://${host}:${port}/${db}`
    this.client = new MongoClient(url, { useUnifiedTopology: true })
    this.client.connect()
    this.client.on('error', (err) => {
    console.log(err)
    })
  }

  isAlive() {
    return this.client.isConnected()
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments()
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments()
  }

  async getUsers() {
    return await this.client.db().collection('user').find({}).toArray
  }

  async getUserByEmail(email) {
    return await this.client.db().collection('user').findOne({'email': email})
  }

  async insertUser(doc) {
    const info = await this.client.db().collection('user').insertOne(doc)
    return info
  }
}

const dbClient = new DBClient()
export default dbClient
