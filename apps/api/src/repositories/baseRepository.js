import { mapMongoDuplicateError } from "../models/utils/errors.js";

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(doc, options = {}) {
    try {
      const created = await this.model.create([doc], options);
      return created[0];
    } catch (error) {
      throw mapMongoDuplicateError(error);
    }
  }

  findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options);
  }

  findOne(filter, projection = null, options = {}) {
    return this.model.findOne(filter, projection, options);
  }

  async updateOne(filter, update, options = {}) {
    try {
      return await this.model.updateOne(filter, update, {
        runValidators: true,
        ...options
      });
    } catch (error) {
      throw mapMongoDuplicateError(error);
    }
  }
}
