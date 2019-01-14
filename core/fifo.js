function Node (list, val) {
  this.prev = this.next = this
  this.value = val
  this.list = list
}

Node.prototype.link = function (next) {
  this.next = next
  next.prev = this
  return next
}

function fifo () {
  if (!(this instanceof fifo)) return new fifo()
  this.node = null
  this.length = 0
}

fifo.prototype.set = function (node, value) {
  if (!node || node.list !== this) return null
  node.value = value
  return node
}

fifo.prototype.next = function (node) {
  if (!node) return this.node
  return node.next === this.node ? null : node.next
}

fifo.prototype.prev = function (node) {
  if (!node) return this.node
  return node === this.node ? null : node.prev
}

fifo.prototype.get = function (node) {
  if (!node || node.list !== this) return null
  return node.value
}

fifo.prototype.remove = function (node) {
  if (!node || node.list !== this) return null
  this.length--
  node.list = null
  node.prev.link(node.next)
  if (node === this.node) this.node = node.next === node ? null : node.next
  return node.link(node).value
}

fifo.prototype.unshift = function (value) {
  return this.node = this.push(value)
}

fifo.prototype.push = function (value) {
  return this.add(new Node(this, value))
}

fifo.prototype.bump = function (node) {
  if (node.list !== this) return false
  this.remove(node)
  this.add(node)
  return true
}

fifo.prototype.add = function (node) {
  this.length++
  if (!node.list) node.list = this
  if (!this.node) return this.node = node
  this.node.prev.link(node)
  node.link(this.node)
  return node
}

fifo.prototype.first = function () {
  return this.node && this.node.value
}

fifo.prototype.last = function () {
  return this.node && this.node.prev.value
}

fifo.prototype.shift = function () {
  return this.node && this.remove(this.node)
}

fifo.prototype.pop = function () {
  return this.node && this.remove(this.node.prev)
}

fifo.prototype.isEmpty = function () {
  return this.length === 0 || this.node === null
}

fifo.prototype.removeAll =
fifo.prototype.clear = function () {
  if (this.length !== 0 && this.node !== null) {
    this.length = 0
    this.node = null
  }
}

fifo.prototype.forEach = function (fn) {
  for (var node = this.node; node; node = this.next(node)) {
    fn(node.value, node)
  }
}

fifo.prototype.toArray = function () {
  var list = []
  for (var node = this.node; node; node = this.next(node)) {
    list.push(node.value)
  }
  return list
}

module.exports = fifo
