'use strict';

module.exports = function(app, options) {
  const remotes = app.remotes();

  const applyRange  = function(model, name, ctx, next) {
    if (!ctx.res._headerSent) {
      const maxLimit = options && options.maxLimit;
      let limit = options && options.defaultLimit || 0;
      let offset = 0;
      let filter;

      if (!ctx.args)
        ctx.args = {};

      if (!ctx.args.filter)
        ctx.args.filter = {};

      if (ctx.args.filter.where)
        filter = ctx.args.filter.where;

      if (
        ctx.args.filter.limit == null ||
        ctx.args.filter.limit !== parseInt(ctx.args.filter.limit, 10)
      )
        ctx.args.filter.limit = limit;
      else
        limit = ctx.args.filter.limit;

      if (maxLimit && maxLimit > 0 && (limit > maxLimit || limit === 0)) {
        limit = maxLimit;
        ctx.args.filter.limit = limit;
      }

      if (ctx.args.filter.offset)
        offset = ctx.args.filter.offset;
      else
        ctx.args.filter.offset = offset;

      if (typeof model.count === 'function') {
        model.count(filter, function(err, count) {
          limit = limit === 0 ? count : limit;
          const last = Math.min(offset + limit, count);
          ctx.res.set('Access-Control-Expose-Headers', 'Content-Range');
          ctx.res.set(
            'Content-Range',
            `${name.toLowerCase()} ${offset}-${last}/${count}`
          );
          next();
        });
      } else {
        next();
      }
    }
  };

  const applyModelRange = function(ctx, next) {
    const name = this.pluralModelName || this.name;
    applyRange(this, name, ctx, next);
  };

  const applyRelationRange  = function(ctx, next) {
    if (ctx.methodString.includes('prototype.__get__')) {
      const methodName = ctx.method.name;
      let modelName = ctx.methodString.split('.prototype').shift();
      modelName = modelName.charAt(0).toUpperCase() + modelName.substr(1);
      const relationName = methodName.split('get__').pop();

      app.models[modelName].findById(ctx.req.params.id,
        function(err, element) {
          if (err) {
            next();
          } else {
            applyRange(element[relationName], relationName, ctx, next);
          }
        });
    } else {
      next();
    }
  };

  const pattern = options &&
    Array.isArray(options.pattern) ? options.pattern : ['*.find'];

  const hooks = ["before", "after"];
  const {remoteModelRange = "before", remoteRelationRange = "before"} = options;
  const modelRange = hooks.indexOf(remoteModelRange) !== -1 ? remoteModelRange : "before";
  const relationRange = hooks.indexOf(remoteRelationRange) !== -1 ? remoteRelationRange : "before";

  for (let i = pattern.length - 1; i >= 0; i--) {
    remotes[modelRange](pattern[i], applyModelRange);
  }

  const relatedModels = options &&
    options.relatedModels !== undefined ? options.relatedModels : true;

  if (relatedModels)
    remotes[relationRange]('*.prototype.*', applyRelationRange);
};
