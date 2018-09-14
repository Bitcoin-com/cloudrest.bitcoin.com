const passport = require("koa-passport");
const Node = require("../../models/nodes");
const Invoice = require("../../models/invoices");
const Appsettings = require("../../models/appsettings");
const getBchRate = require("../../services/price");
const getNewPaymentAddress = require("../../services/payment-address");

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
 * @apiSuccess {Object}   node              Node object
 * @apiSuccess {String}   node.name         Node name
 * @apiSuccess {String}   node.flavor       Node flavor
 * @apiSuccess {Object}   invoice           Invoice object
 * @apiSuccess {String}   invoice.price     Invoice price
 * @apiSuccess {Date}     invoice.expires   Invoice expiration date
 * @apiSuccess {Date}     invoice.address   Invoice payment address
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "node": {
 *          "name": "my-amazing-node"
 *          "flavor": "abc.0.18.0"
 *        },
 *        "invoice": {
 *          "price": "0.00001000",
 *          "expires": "2018-10-01",
 *          "address": "bitcoincash:qpk4hk3wuxe2uqtqc97n8atzrrr6r5mleczf9sur4h"
 *        }
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
  return passport.authenticate("local", async user => {
    try {
      const appsettings = await Appsettings.getAppsettingsForEnv();
      const nodeDefaults = appsettings.node_defaults.toJSON();
      const userInput = {
        flavor: ctx.request.body.flavor,
        name: ctx.request.body.name
      };
      const nodeSettings = Object.assign({}, nodeDefaults, userInput);

      const node = new Node({
        _user: ctx.state.user._id,
        ...nodeSettings
      });

      await node.save();
      ctx.state.user.nodes.push(node);
      await ctx.state.user.save();

      // Create invoice for requested node
      const currentBchRate = await getBchRate();
      const paymentAddress = await getNewPaymentAddress();
      const priceQuote =
        parseFloat(appsettings.usd_per_minute) / currentBchRate;
      let now = new Date();
      let expiresAt = new Date(
        now.getTime() + appsettings.quote_valid_minutes * 60 * 1000
      );
      const invoice = new Invoice({
        _node: node._id,
        bch_address: paymentAddress,
        bch_per_minute: priceQuote,
        expires_at: expiresAt
      });
      await invoice.save();
      node.invoices.push(invoice);
      await node.save();

      ctx.status = 200;
      ctx.body = {
        node: {
          name: node.name,
          flavor: node.flavor
        },
        invoice: invoice.toJSON()
      };
    } catch (err) {
      ctx.throw(422, err.message);
    }
  })(ctx, next);
};

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
  return passport.authenticate("local", async user => {
    const nodes = await Node.find({ _user: ctx.state.user._id });

    ctx.status = 200;
    ctx.body = JSON.stringify(nodes);
  })(ctx, next);
};

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
  return passport.authenticate("local", async user => {
    const nodes = await Node.find({ _user: ctx.state.user._id });

    ctx.status = 200;
    ctx.body = JSON.stringify(nodes);
  })(ctx, next);
};

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

let updateNode = async ctx => {
  // TODO: Update Node
  const user = ctx.body.user;

  Object.assign(user, ctx.request.body.user);

  await user.save();

  ctx.body = {
    user
  };
};

let deleteNode = async (ctx, next) => {
  return passport.authenticate("local", user => {
    ctx.status = 200;
    ctx.body = {
      success: `delete ${ctx.params.name}`
    };
  })(ctx, next);
};

module.exports = {
  createNode,
  getNodes,
  getNode,
  updateNode,
  deleteNode
};
