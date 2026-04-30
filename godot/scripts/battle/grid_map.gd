extends RefCounted
class_name TacticalGridMap

var width = 0
var height = 0
var cells = {}
var terrain_defs = {}
var objects = {}
var tile_width = 72.0
var tile_height = 36.0
var level_height = 16.0

func load_from_data(map_data: Dictionary, terrain_data: Array) -> void:
	width = int(map_data.get("width", 0))
	height = int(map_data.get("height", 0))
	cells.clear()
	terrain_defs.clear()
	objects.clear()
	for terrain in terrain_data:
		terrain_defs[terrain.get("id", "")] = terrain
	for raw_cell in map_data.get("cells", []):
		var pos = Vector2i(int(raw_cell.get("x", 0)), int(raw_cell.get("y", 0)))
		cells[_key(pos)] = raw_cell
	for raw_object in map_data.get("objects", []):
		var pos = Vector2i(int(raw_object.get("x", 0)), int(raw_object.get("y", 0)))
		var object = raw_object.duplicate(true)
		object["pos"] = pos
		objects[_key(pos)] = object

func _key(pos: Vector2i) -> String:
	return "%s,%s" % [pos.x, pos.y]

func in_bounds(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.y >= 0 and pos.x < width and pos.y < height

func cell(pos: Vector2i) -> Dictionary:
	return cells.get(_key(pos), {})

func height_at(pos: Vector2i) -> int:
	return int(cell(pos).get("height", 0))

func terrain_at(pos: Vector2i) -> String:
	return cell(pos).get("terrain", "plain")

func objective_at(pos: Vector2i) -> String:
	return cell(pos).get("objective", "")

func is_passable(pos: Vector2i) -> bool:
	if not in_bounds(pos):
		return false
	if object_blocks_movement(pos):
		return false
	var terrain_id = terrain_at(pos)
	var terrain: Dictionary = terrain_defs.get(terrain_id, {})
	return bool(terrain.get("passable", true))

func object_at(pos: Vector2i) -> Dictionary:
	return objects.get(_key(pos), {})

func object_blocks_movement(pos: Vector2i) -> bool:
	var object = object_at(pos)
	return not object.is_empty() and bool(object.get("blocks_movement", false)) and int(object.get("durability", 1)) != 0

func object_blocks_vision(pos: Vector2i) -> bool:
	var object = object_at(pos)
	return not object.is_empty() and bool(object.get("blocks_vision", false)) and int(object.get("durability", 1)) != 0

func object_blocks_projectile(pos: Vector2i) -> bool:
	var object = object_at(pos)
	return not object.is_empty() and bool(object.get("blocks_projectile", false)) and int(object.get("durability", 1)) != 0

func object_is_targetable(pos: Vector2i) -> bool:
	var object = object_at(pos)
	return not object.is_empty() and bool(object.get("targetable", false)) and int(object.get("durability", 0)) > 0

func damage_object_at(pos: Vector2i, amount: int) -> Dictionary:
	var key = _key(pos)
	var object = objects.get(key, {})
	if object.is_empty() or not bool(object.get("destructible", false)):
		return {"ok": false, "reason": "not-destructible"}
	var before = int(object.get("durability", 0))
	var after = max(0, before - max(1, amount))
	object["durability"] = after
	if after <= 0:
		object["blocks_movement"] = false
		object["blocks_vision"] = false
		object["blocks_projectile"] = false
	objects[key] = object
	return {"ok": true, "before": before, "after": after, "destroyed": after <= 0, "object": object}

func action_blocked_at(pos: Vector2i, mode: String) -> bool:
	var terrain_id = terrain_at(pos)
	var terrain: Dictionary = terrain_defs.get(terrain_id, {})
	var blocked: Array = terrain.get("action_blocked", [])
	return blocked.has(mode)

func move_cost(pos: Vector2i) -> int:
	var terrain_id = terrain_at(pos)
	var terrain: Dictionary = terrain_defs.get(terrain_id, {})
	return max(1, int(terrain.get("move_cost", 1)))

func neighbors4(pos: Vector2i) -> Array:
	return [pos + Vector2i(1, 0), pos + Vector2i(-1, 0), pos + Vector2i(0, 1), pos + Vector2i(0, -1)]

func tile_to_world(pos: Vector2i) -> Vector2:
	return Vector2((pos.x - pos.y) * tile_width * 0.5, (pos.x + pos.y) * tile_height * 0.5 - height_at(pos) * level_height)

func world_to_tile(local_pos: Vector2) -> Vector2i:
	var best = Vector2i(-1, -1)
	var best_distance = INF
	for y in range(height):
		for x in range(width):
			var pos = Vector2i(x, y)
			var center = tile_to_world(pos)
			var d = center.distance_squared_to(local_pos)
			if d < best_distance:
				best_distance = d
				best = pos
	return best

func all_positions() -> Array:
	var result: Array = []
	for y in range(height):
		for x in range(width):
			result.append(Vector2i(x, y))
	return result

func occupied_positions(units: Array) -> Dictionary:
	var occupied = {}
	for unit in units:
		if unit.is_alive():
			occupied[_key(unit.grid_pos)] = unit
	return occupied

func reachable(start: Vector2i, move_points: int, jump: int, units: Array) -> Array:
	var occupied = occupied_positions(units)
	occupied.erase(_key(start))
	var frontier: Array = [start]
	var cost = {_key(start): 0}
	var paths = {_key(start): [start]}
	var result: Array = []
	while not frontier.is_empty():
		var current: Vector2i = frontier.pop_front()
		for next in neighbors4(current):
			if not is_passable(next):
				continue
			if occupied.has(_key(next)):
				continue
			var step_height: int = abs(height_at(next) - height_at(current))
			if step_height > jump:
				continue
			var next_cost: int = int(cost[_key(current)]) + move_cost(next)
			if next_cost > move_points:
				continue
			var next_key = _key(next)
			if not cost.has(next_key) or next_cost < int(cost[next_key]):
				cost[next_key] = next_cost
				frontier.append(next)
				var next_path: Array = paths[_key(current)].duplicate()
				next_path.append(next)
				paths[next_key] = next_path
				result.append({
					"pos": next,
					"x": next.x,
					"y": next.y,
					"cost": next_cost,
					"path": next_path
				})
	return result

func reachable_positions(start: Vector2i, move_points: int, jump: int, units: Array) -> Array:
	return reachable(start, move_points, jump, units).map(func(item): return item.get("pos", Vector2i(-1, -1)))

func move_rejection_reason(start: Vector2i, target: Vector2i, move_points: int, jump: int, units: Array) -> String:
	if not in_bounds(target):
		return "越界"
	if not is_passable(target):
		return "不可通行"
	var occupied = occupied_positions(units)
	occupied.erase(_key(start))
	if occupied.has(_key(target)):
		return "已被占据"
	var path = find_path(start, target, jump, units)
	if path.is_empty():
		return "高度差过大或被阻挡"
	var total_cost = 0
	for i in range(1, path.size()):
		total_cost += move_cost(path[i])
	if total_cost > move_points:
		return "超出移动范围"
	return "不在预览范围内"

func find_path(start: Vector2i, target: Vector2i, jump: int, units: Array) -> Array:
	if start == target:
		return [start]
	var occupied = occupied_positions(units)
	occupied.erase(_key(start))
	var frontier: Array = [start]
	var came_from = {_key(start): null}
	while not frontier.is_empty():
		var current: Vector2i = frontier.pop_front()
		if current == target:
			break
		for next in neighbors4(current):
			var next_key = _key(next)
			if came_from.has(next_key):
				continue
			if not is_passable(next):
				continue
			if occupied.has(next_key):
				continue
			if abs(height_at(next) - height_at(current)) > jump:
				continue
			came_from[next_key] = current
			frontier.append(next)
	var target_key = _key(target)
	if not came_from.has(target_key):
		return []
	var path: Array = []
	var cursor = target
	while cursor != null:
		path.push_front(cursor)
		cursor = came_from[_key(cursor)]
	return path

func has_line_of_sight(from: Vector2i, to: Vector2i) -> bool:
	if not in_bounds(from) or not in_bounds(to):
		return false
	for current in ray_positions(from, to):
		var terrain_id = terrain_at(current)
		var terrain: Dictionary = terrain_defs.get(terrain_id, {})
		if int(terrain.get("cover", 0)) >= 2 or object_blocks_vision(current):
			return false
	return true

func has_projectile_path(from: Vector2i, to: Vector2i) -> bool:
	if not has_line_of_sight(from, to):
		return false
	for current in ray_positions(from, to):
		if object_blocks_projectile(current):
			return false
	return true

func projectile_blocker(from: Vector2i, to: Vector2i) -> Dictionary:
	for current in ray_positions(from, to):
		if object_blocks_projectile(current):
			return {"pos": current, "object": object_at(current)}
	return {}

func ray_positions(from: Vector2i, to: Vector2i) -> Array:
	var result: Array = []
	var current = from
	var guard = 0
	while current != to and guard < width * height:
		guard += 1
		var dx = signi(to.x - current.x)
		var dy = signi(to.y - current.y)
		if abs(to.x - current.x) > abs(to.y - current.y):
			current += Vector2i(dx, 0)
		elif abs(to.y - current.y) > 0:
			current += Vector2i(0, dy)
		if current != to:
			result.append(current)
	return result

func distance(a: Vector2i, b: Vector2i) -> int:
	return abs(a.x - b.x) + abs(a.y - b.y)

func signi(value: int) -> int:
	if value > 0:
		return 1
	if value < 0:
		return -1
	return 0
