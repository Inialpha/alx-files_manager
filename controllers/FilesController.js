import { ObjectId } from 'mongodb';
import { join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const FilesController = {
  async postUpload(req, res) {
    const token = `auth_${req.headers['x-token']}`;
    const userId = await redisClient.get(token);

    if (!userId) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return;
    }

    const user = await dbClient.getUser({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return;
    }

    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    let parentId = req.body ? req.body.parentId : null;
    if (!parentId) {
      parentId = 0;
    }
    let isPublic = req.body ? req.body.isPublic : null;
    if (!isPublic) {
      isPublic = false;
    }
    const data = req.body ? req.body.data : null;

    if (!name) {
      res.status(400);
      res.json({ error: 'Missing name' });
      return;
    }
    const TypeList = ['folder', 'file', 'image'];
    if (!type || (!TypeList.includes(type))) {
      res.status(400);
      res.json({ error: 'Missing type' });
      return;
    }

    if (!data && type !== 'folder') {
      res.status(400);
      res.json({ error: 'Missing data' });
      return;
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.getFile({ _id: ObjectId(parentId) });
      if (!parentFile) {
        res.status(400);
        res.json({ error: 'Parent not found' });
        return;
      }
      if (parentFile.type !== 'folder') {
        res.status(400);
        res.json({ error: 'Parent is not a folder' });
        return;
      }
    }

    if (type === 'folder') {
      const doc = {
        userId: user._id, name, type, parentId,
      };
      const insertInfo = await dbClient.insertFile(doc);
      res.status(201);
      res.json({
        id: insertInfo.insertedId, userId: user._id, name, type, isPublic, parentId,
      });
      return;
    }
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manenger';
    fs.mkdir(FOLDER_PATH, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      }
      const filePath = join(FOLDER_PATH, uuidv4());
      fs.writeFile(filePath, Buffer.from(data, 'base64'), 'utf-8', async (err) => {
        if (err) {
          console.log(err);
        }
        const doc = {
          userId: user._id, name, type, isPublic, parentId, localpath: filePath,
        };
        const insertInfo = await dbClient.insertFile(doc);
        res.status(201);
        res.json({
          id: insertInfo.insertedId,
          userId: user._id,
          name,
          type,
          parentId,
          isPublic,
          localpath: filePath,
        });
      });
    });
  },
};

export default FilesController;
