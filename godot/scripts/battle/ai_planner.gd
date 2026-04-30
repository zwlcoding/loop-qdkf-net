extends RefCounted
class_name AiPlanner

static func choose_plan(controller, unit) -> Dictionary:
	var target_modes = ["attack", "skill", "combo"]
	for mode in target_modes:
		var targets = controller.target_preview_for_unit(unit, mode)
		if not targets.is_empty():
			var best_target = _nearest_target(controller, unit, targets)
			return {
				"type": "action",
				"mode": mode,
				"target_tile": best_target.get("pos", unit.grid_pos),
				"summary": "%s %s" % [mode, best_target.get("unit").id]
			}

	var reachable: Array = controller.movement_preview_for(unit)
	if reachable.is_empty():
		return {"type": "wait"}

	var enemies = controller.units_for_team("player").filter(func(candidate): return candidate.is_alive())
	var anchors = enemies.map(func(enemy): return enemy.grid_pos)
	var best = reachable[0]
	var best_distance = _distance_to_anchors(controller, best.get("pos"), anchors)
	for candidate in reachable:
		var distance = _distance_to_anchors(controller, candidate.get("pos"), anchors)
		if distance < best_distance:
			best = candidate
			best_distance = distance
	return {"type": "move", "position": best.get("pos", unit.grid_pos), "summary": "advance"}

static func _nearest_target(controller, unit, previews: Array) -> Dictionary:
	var best = previews[0]
	var best_distance = controller.grid.distance(unit.grid_pos, best.get("pos", unit.grid_pos))
	for preview in previews:
		var distance = controller.grid.distance(unit.grid_pos, preview.get("pos", unit.grid_pos))
		if distance < best_distance:
			best = preview
			best_distance = distance
	return best

static func _distance_to_anchors(controller, pos: Vector2i, anchors: Array) -> int:
	if anchors.is_empty():
		return 0
	var best = 999
	for anchor in anchors:
		best = min(best, controller.grid.distance(pos, anchor))
	return best
