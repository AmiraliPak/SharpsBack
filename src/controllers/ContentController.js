﻿const Controller = require("./Controller");
const ContentService = require("../services/ContentService");
const Content = require("../models/Content");
const { AppError } = require("../helpers/AppError");
const contentService = new ContentService(Content);
const userService = new (require("../services/UserService"))(require("../models/User"));

class ContentController extends Controller {
  constructor(service) {
    super(service);
    this.insertAll = this.insertAll.bind(this);
    this.topTrendContents = this.topTrendContents.bind(this);
    this.putSuggestions = this.putSuggestions.bind(this);
    this.search = this.search.bind(this);
  }

  async insertAll(req, res, next) {
    try {
      const contents = req.body;
      const response = await this.service.insertAll(contents);
      return res.status(201).send(response).end();
    } catch (e) {
      next(new AppError("something wrong", 400));
    }
  }

  async putSuggestions(req, res, next) {
    try {
      const { suggesters } = req.body;
      if (!suggesters) throw new AppError("missing field in body", 400);
      for (const obj of suggesters) {
        const _id = obj.userID;
        const user = await userService.getOne({ _id });
        if (!user) throw new AppError("invalid userID", 400);

        const contentIds = obj.suggestions;
        if (contentIds.length != 0) await userService.addSuggestions(user, contentIds);
      }
      return res.sendStatus(200).end();
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    const SEARCHABLES = ["url", "title", "tags"];
    try {
      const { s: queryString, limit, skip } = req.query;
      if (!queryString) return res.status(200).json(await this.service.getAll({ limit, skip, sort: { createdAt: -1 } })).end;

      let searchOn = SEARCHABLES.filter((field) => req.query[field] === "true");
      if (searchOn.length == 0) searchOn = SEARCHABLES;

      const results = await this.service.search(queryString, searchOn, { limit, skip });
      results.items = await this.service.setUserFields(req.user, results.items);
      return res.status(200).json(results).end();
    } catch (err) {
      next(err);
    }
  }

  async topTrendContents(req, res, next) {
    try {
      let { skip, limit } = req.query;
      const contents = await contentService.getAll({ skip, limit, sort: { createdAt: -1 } });
      return res.status(200).json(contents).end();
      // return res.status(200).json({ hi: "hi" }).end();
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
}

module.exports = new ContentController(contentService);
