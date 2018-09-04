const passport = require('koa-passport')
const Node = require('../../models/nodes')

/**
 * @api {post} /nodes Create a new node
 * @apiPermission
 * @apiVersion 1.0.0
 * @apiName CreateNode
 * @apiGroup Nodes
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X POST -d '{ "node": { "type": "Node", "name": "my amazing node", "flavor": "abc.0.18.0" } }' localhost:5000/nodes
 *
 * @apiParam {Object} node          Node object (required)
 * @apiParam {String} node.type Type.
 * @apiParam {String} node.name Name.
 * @apiParam {String} node.flavor Flavor.
 *
 * @apiSuccess {Object}   node           Node object
 * @apiSuccess {ObjectId} node._id       Node id
 * @apiSuccess {String}   node.type      Node type
 * @apiSuccess {String}   node.name      Node name
 * @apiSuccess {String}   node.flavor    Node flavor
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "node": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "type": "Node"
 *          "name": "my amazing node"
 *          "flavor": "abc.0.18.0"
 *       }
 *     }
 *
 * @apiError UnprocessableEntity Missing required parameters
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "status": 422,
 *       "error": "Unprocessable Entity"
 *     }
 */
let createNode = async (ctx, next) => {
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

/**
 * @api {get} /nodes Get all nodes
 * @apiPermission nodes
 * @apiVersion 1.0.0
 * @apiName GetNodes
 * @apiGroup Nodes
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X GET localhost:5000/nodes
 *
 * @apiSuccess {Object[]} nodes           Array of user objects
 * @apiSuccess {ObjectId} nodes._id       User id
 * @apiSuccess {String}   nodes.type      Node type
 * @apiSuccess {String}   nodes.name      Node name
 * @apiSuccess {String}   nodes.flavor    Node flavor
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "nodes": [{
 *          "_id": "56bd1da600a526986cf65c80"
 *          "type": "Node"
 *          "name": "my amazing node"
 *          "flavor": "abc.0.18.0"
 *       }]
 *     }
 *
 * @apiUse TokenError
 */
let getNodes = async (ctx, next) => {
  // TODO: Get all nodes
  return passport.authenticate('local', async (user) => {
    const nodes = await Node.find({ _user: ctx.state.user._id })

    ctx.status = 200;
    ctx.body = JSON.stringify(nodes)
  })(ctx, next)
}

/**
 * @api {get} /nodes/:id Get user by id
 * @apiPermission node
 * @apiVersion 1.0.0
 * @apiName GetNode
 * @apiGroup Nodes
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X GET localhost:5000/nodes/56bd1da600a526986cf65c80
 *
 * @apiSuccess {Object}   nodes           Node object
 * @apiSuccess {ObjectId} nodes._id       Node id
 * @apiSuccess {String}   nodes.type      Node type
 * @apiSuccess {String}   nodes.name      Node name
 * @apiSuccess {String}   nodes.flavor    Node flavor
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "type": "Node"
 *          "name": "my amazing node"
 *          "flavor": "abc.0.18.0"
 *       }
 *     }
 *
 * @apiUse TokenError
 */
let getNode = async (ctx, next) => {
  return passport.authenticate('local', async (user) => {
    const nodes = await Node.find({ _user: ctx.state.user._id })

    ctx.status = 200;
    ctx.body = JSON.stringify(nodes)
  })(ctx, next)
}

/**
 * @api {put} /nodes/:id Update a node
 * @apiPermission
 * @apiVersion 1.0.0
 * @apiName UpdateNode
 * @apiGroup Nodes
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X PUT -d '{ "node": { "name": "Cool new Name" } }' localhost:5000/nodes/56bd1da600a526986cf65c80
 *
 * @apiParam {Object} node          Node object (required)
 * @apiParam {String} node.name     Name.
 * @apiParam {String} nodes.type    Type.
 * @apiParam {String} nodes.flavor  Flavor.
 *
 * @apiSuccess {Object}   nodes           Node object
 * @apiSuccess {ObjectId} nodes._id       Node id
 * @apiSuccess {String}   nodes.name      Updated name
 * @apiSuccess {String}   nodes.type      Updated type
 * @apiSuccess {String}   nodes.flavor    Updated flavor
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "name": "Cool new name"
 *          "username": "johndoe"
 *       }
 *     }
 *
 * @apiError UnprocessableEntity Missing required parameters
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "status": 422,
 *       "error": "Unprocessable Entity"
 *     }
 *
 * @apiUse TokenError
 */

let updateNode = async (ctx) => {
  // TODO: Update Node
  const user = ctx.body.user

  Object.assign(user, ctx.request.body.user)

  await user.save()

  ctx.body = {
    user
  }
}

let deleteNode = async (ctx, next) => {
  return passport.authenticate('local', (user) => {
    ctx.status = 200;
    ctx.body = {
      success: `delete ${ctx.params.name}`
    }
  })(ctx, next)
}

module.exports = {
  createNode,
  getNodes,
  getNode,
  updateNode,
  deleteNode
}
