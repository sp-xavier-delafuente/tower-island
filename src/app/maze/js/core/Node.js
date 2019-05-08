/**
 * A node in grid. 
 * This class holds some basic information about a node and custom 
 * attributes may be added, depending on the algorithms' needs.
 * @constructor
 * @param {number} x - The x coordinate of the node on the grid.
 * @param {number} y - The y coordinate of the node on the grid.
 * @param {boolean} [isWallPosition] - Whether this node is walkable.
 * @param {boolean} [walkable] - Whether this node is walkable.
 */
function Node(x, y, isWallPosition, walkable, catapultTo) {
    /**
     * The x coordinate of the node on the grid.
     * @type number
     */
    this.x = x;
    /**
     * The y coordinate of the node on the grid.
     * @type number
     */
    this.y = y;
    /**
     * Whether this wall node can be walked through.
     * @type boolean
     */
    this.walkable = (walkable === undefined ? true : walkable);
    /**
     * Whether this node can be a wall
     * @type boolean
     */
    this.isWallPosition = (isWallPosition === undefined ? false : isWallPosition);

    this.catapultTo = catapultTo;
}

module.exports = Node;