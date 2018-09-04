const passport = require('koa-passport')
const Node = require('../../models/nodes')

async function list (ctx, next) {
  return passport.authenticate('local', async (user) => {
    const nodes = await Node.find({ _user: ctx.state.user._id })

    ctx.status = 200;
    ctx.body = JSON.stringify(nodes)
  })(ctx, next)
}

async function create (ctx, next) {
  return passport.authenticate('local', async (user) => {
    const node = new Node({_user: ctx.state.user._id, ...ctx.request.body})
    try {
      await node.save()
      ctx.state.user.nodes.push(node)
      await ctx.state.user.save()
    } catch (err) {
      ctx.throw(422, err.message)
    }

    ctx.status = 200
    ctx.body = node.toJSON()
  })(ctx, next)
}

async function remove (ctx, next) {
  return passport.authenticate('local', (user) => {
    ctx.status = 200;
    ctx.body = {
      success: `delete ${ctx.params.name}`
    }
  })(ctx, next)
}

module.exports.list = list
module.exports.create = create
module.exports.remove = remove
