module.exports = function(app, options) {
  const remotes = app.remotes();

  const applyRange  = function(model, name, ctx, next) {
    if (!ctx.res._headerSent) {
      let filter;
      let limit = 50;
      let offset = 0;

      if (ctx.args && ctx.args.filter) {
        if (ctx.args.filter.where)
          filter = ctx.args.filter.where;
        if (ctx.args.filter.limit)
          limit = ctx.args.filter.limit;
        if (ctx.args.filter.offset)
          offset = ctx.args.filter.offset;
      }

      model.count(filter, function(err, count) {
        const last = Math.min(offset + limit, count);
        ctx.res.set('Access-Control-Expose-Headers', 'Content-Range');
        ctx.res.set(
          'Content-Range',
          `${name.toLowerCase()} ${offset}-${last}/${count}`
        );
        next();
      });
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
  for (let i = pattern.length - 1; i >= 0; i--) {
    remotes.after(pattern[i], applyModelRange);
  }

  const relatedModels = options &&
    options.relatedModels !== undefined ? options.relatedModels : true;

  if (relatedModels)
    remotes.after('*.prototype.*', applyRelationRange);
};
