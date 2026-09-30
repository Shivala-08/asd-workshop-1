const express = require('express')
const controller = require('../controllers/product.controller')
const { cacheable } = require('../middleware/cache')

const router = express.Router()

// GET endpoints use the cache middleware (Route -> Middleware -> Controller)
router.get('/', cacheable(() => 'products'), controller.getProducts)
router.get('/:id', cacheable((req) => `products:${req.params.id}`), controller.getProductById)

// Write endpoints: controller invalidates the cache after a successful write
router.post('/', controller.createProduct)
router.put('/:id', controller.updateProduct)
router.patch('/:id', controller.updateProduct)
router.delete('/:id', controller.deleteProduct)

module.exports = router
