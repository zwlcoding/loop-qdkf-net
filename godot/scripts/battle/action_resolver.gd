extends RefCounted
class_name ActionResolver

static func estimate_attack_damage(attacker, defender, grid, power_bonus: int = 0, skill_id: String = "attack") -> int:
	var positional = _positional_bonus(attacker, defender)
	var height_bonus: int = clamp(grid.height_at(attacker.grid_pos) - grid.height_at(defender.grid_pos), -1, 2)
	var base: int = attacker.attack + positional + height_bonus + power_bonus - defender.defense
	if skill_id == "heavy":
		base += 3
	return max(1, base)

static func hit_forecast(attacker, defender, grid, module: Dictionary = {}) -> Dictionary:
	var base = int(module.get("accuracy", 82))
	if module.is_empty():
		base = 84
	var arc = facing_arc(attacker, defender)
	var arc_bonus = 0
	match arc:
		"rear":
			arc_bonus = 18
		"side":
			arc_bonus = 8
		"front":
			arc_bonus = -8
	var height_diff: int = grid.height_at(attacker.grid_pos) - grid.height_at(defender.grid_pos)
	var height_bonus = clamp(height_diff * 4, -10, 10)
	var cover_penalty = int(grid.terrain_defs.get(grid.terrain_at(defender.grid_pos), {}).get("cover", 0)) * 6
	var sight_penalty = 0 if grid.has_line_of_sight(attacker.grid_pos, defender.grid_pos) else 35
	var status_bonus = 0
	if defender.statuses.has("root"):
		status_bonus += 8
	if defender.statuses.has("stun"):
		status_bonus += 15
	if attacker.statuses.has("blind"):
		status_bonus -= 25
	var chance = clamp(base + arc_bonus + height_bonus + status_bonus - cover_penalty - sight_penalty, 5, 95)
	var modifiers: Array = []
	modifiers.append(_arc_label(arc))
	if height_bonus != 0:
		modifiers.append("高差%s" % _signed(height_bonus))
	if cover_penalty > 0:
		modifiers.append("掩护-%s" % cover_penalty)
	if sight_penalty > 0:
		modifiers.append("视线受阻-%s" % sight_penalty)
	if status_bonus != 0:
		modifiers.append("状态%s" % _signed(status_bonus))
	return {
		"chance": chance,
		"arc": arc,
		"modifiers": modifiers,
		"height_bonus": height_bonus,
		"cover_penalty": cover_penalty,
		"sight_penalty": sight_penalty
	}

static func resolve_attack(attacker, defender, grid, skill_id: String = "attack", power_bonus: int = 0) -> Dictionary:
	var positional = _positional_bonus(attacker, defender)
	var height_bonus: int = clamp(grid.height_at(attacker.grid_pos) - grid.height_at(defender.grid_pos), -1, 2)
	var base: int = estimate_attack_damage(attacker, defender, grid, power_bonus, skill_id)
	var damage = defender.apply_damage(base)
	var result = {
		"type": "attack",
		"attacker": attacker.id,
		"defender": defender.id,
		"damage": damage,
		"positional_bonus": positional,
		"height_bonus": height_bonus,
		"defeated": not defender.is_alive()
	}
	if skill_id == "slow":
		defender.add_status("slow")
		result["status"] = "slow"
	return result

static func resolve_knockback(attacker, defender, grid, units: Array, distance: int = 1) -> Dictionary:
	var direction = Vector2i(signi(defender.grid_pos.x - attacker.grid_pos.x), signi(defender.grid_pos.y - attacker.grid_pos.y))
	if direction == Vector2i.ZERO:
		direction = Vector2i(1, 0)
	var blocked = false
	var fall_damage = 0
	var collision_damage = 0
	var travelled = 0
	var target = defender.grid_pos
	for _i in range(distance):
		var next = target + direction
		if not grid.is_passable(next):
			blocked = true
			collision_damage += defender.apply_damage(2)
			break
		for unit in units:
			if unit != defender and unit.is_alive() and unit.grid_pos == next:
				blocked = true
				collision_damage += defender.apply_damage(2)
				break
		if blocked:
			break
		var drop: int = grid.height_at(target) - grid.height_at(next)
		target = next
		travelled += 1
		if drop >= 2:
			fall_damage = defender.apply_damage(drop * 2)
	if travelled > 0:
		defender.grid_pos = target
	return {
		"type": "knockback",
		"target": defender.id,
		"blocked": blocked,
		"travelled": travelled,
		"collision_damage": collision_damage,
		"fall_damage": fall_damage,
		"position": defender.grid_pos
	}

static func resolve_combo(attacker, defender, allies: Array, grid) -> Dictionary:
	var participants: Array = []
	var total_damage = attacker.attack + 2
	for ally in allies:
		if ally != attacker and ally.is_alive() and grid.distance(ally.grid_pos, defender.grid_pos) <= 3:
			participants.append(ally.id)
			total_damage += max(2, int(ally.attack * 0.5))
	var damage = defender.apply_damage(total_damage - defender.defense)
	return {
		"type": "combo",
		"attacker": attacker.id,
		"participants": participants,
		"defender": defender.id,
		"damage": damage,
		"defeated": not defender.is_alive()
	}

static func _positional_bonus(attacker, defender) -> int:
	var arc = facing_arc(attacker, defender)
	if arc == "rear":
		return 3
	if arc == "side":
		return 1
	return 0

static func facing_arc(attacker, defender) -> String:
	var delta = attacker.grid_pos - defender.grid_pos
	var attack_dir = "S"
	if abs(delta.x) > abs(delta.y):
		attack_dir = "E" if delta.x > 0 else "W"
	else:
		attack_dir = "S" if delta.y > 0 else "N"
	if attack_dir == defender.facing:
		return "front"
	if _opposite(attack_dir) == defender.facing:
		return "rear"
	return "side"

static func _arc_label(arc: String) -> String:
	match arc:
		"front":
			return "正面"
		"rear":
			return "背面"
		"side":
			return "侧面"
	return arc

static func _signed(value: int) -> String:
	return "+%s" % value if value > 0 else str(value)

static func _opposite(dir: String) -> String:
	match dir:
		"N":
			return "S"
		"S":
			return "N"
		"E":
			return "W"
		"W":
			return "E"
	return "S"

static func signi(value: int) -> int:
	if value > 0:
		return 1
	if value < 0:
		return -1
	return 0
