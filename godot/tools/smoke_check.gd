extends Node

const BattleControllerScript = preload("res://scripts/battle/battle_controller.gd")

func _ready() -> void:
	var ok = true
	ok = _check(ContentRegistry.load_all(), "content loads") and ok
	RunState.start_run("seal_ridge_gate", "ridge_gate")
	var controller = BattleControllerScript.new()
	controller.setup_from_run("quick_parity")
	ok = _check(controller.validation_errors.is_empty(), "quick parity setup validates") and ok
	ok = _check(controller.units_for_team("player").size() == 3, "fixture creates three human player units") and ok
	ok = _check(controller.units_for_team("enemy").size() == 3, "fixture creates three AI enemy units") and ok
	ok = _check(controller.turn_order.any(func(unit): return unit.control == "ai"), "AI units appear in turn order") and ok

	var active = controller.active_unit()
	ok = _check(active != null and active.control == "human", "first active unit is human controlled") and ok
	var reachable: Array = controller.movement_preview_for_active()
	ok = _check(not reachable.is_empty(), "movement preview has reachable path entries") and ok
	if not reachable.is_empty():
		var first_destination: Vector2i = reachable[0].get("pos")
		var start = active.grid_pos
		ok = _check(controller.try_move_active(first_destination).get("ok", false), "active unit moves to reachable tile") and ok
		ok = _check(active.grid_pos != start, "unit logical tile changes") and ok
		var second_destination = _find_different_destination(controller.movement_preview_for_active(), first_destination)
		ok = _check(not controller.try_move_active(second_destination).get("ok", true), "second movement in same turn is rejected") and ok
		ok = _check(active.grid_pos == first_destination, "unit remains at first destination after rejected chained movement") and ok
	ok = _check(controller.last_invalid_reason == "movement-spent", "movement rejection reason is movement-spent") and ok

	ok = _check(not controller.try_action_active_at("attack", Vector2i(0, 0)).get("ok", true), "illegal target tap is rejected") and ok
	ok = _check(not controller.last_invalid_reason.is_empty(), "invalid target reason is reported") and ok
	ok = _check(not controller.feedback_text().is_empty(), "normal feedback text explains invalid target") and ok

	controller.set_mode("skill")
	var skill_summary = controller.selected_module_summary("skill")
	ok = _check(skill_summary.get("name", "") == "缠根射击", "skill mode selects the active unit skill module") and ok
	ok = _check(int(skill_summary.get("range", 0)) == 3, "skill summary exposes configured range") and ok
	ok = _check(controller.action_range_positions_for_active("skill").size() > controller.target_preview_for_active("skill").size(), "skill range preview is separate from legal targets") and ok
	var skill_forecast = controller.selected_action_forecast("skill")
	ok = _check(skill_forecast.has("summary") and String(skill_forecast.get("summary", "")).contains("预判"), "skill forecast exposes expected consequence summary") and ok
	ok = _check(int(skill_forecast.get("damage", 0)) > 0 or bool(skill_forecast.get("blocked", false)), "skill forecast includes damage or a blocker") and ok

	controller.set_mode("combo")
	var combo_summary = controller.selected_module_summary("combo")
	ok = _check(combo_summary.get("name", "") == "裂隙连携", "combo mode selects combo module") and ok
	ok = _check(int(combo_summary.get("cost", 0)) == 1, "combo summary exposes combo cost") and ok
	var combo_forecast = controller.selected_action_forecast("combo")
	ok = _check(combo_forecast.has("participants") or combo_forecast.has("reason"), "combo forecast exposes participants or blocker") and ok
	ok = _check(not controller.combo_eligibility_lines().is_empty(), "combo readiness lines are available") and ok

	controller.set_mode("tool")
	var tool_summary = controller.selected_module_summary("tool")
	ok = _check(tool_summary.get("name", "") == "野战包", "tool mode selects tool module") and ok
	ok = _check(int(tool_summary.get("range", 0)) == 1, "tool summary exposes tool range") and ok
	var tool_forecast = controller.selected_action_forecast("tool")
	ok = _check(tool_forecast.has("summary") and (tool_forecast.has("healing") or tool_forecast.has("reason")), "tool forecast exposes healing or blocker") and ok
	ok = _check(not controller.active_role_summary().get("summary", "").is_empty(), "active unit role summary is available") and ok

	var snap = controller.diagnostics_snapshot()
	ok = _check(not snap.get("active", {}).is_empty(), "diagnostics include active unit") and ok
	ok = _check(int(snap.get("move_preview_count", 0)) >= 0, "diagnostics include move preview count") and ok
	ok = _check(snap.get("selected_module", {}).get("name", "") == "野战包", "diagnostics include selected module summary") and ok
	ok = _check(not snap.get("forecast", {}).get("summary", "").is_empty(), "diagnostics include selected action forecast") and ok
	ok = _check(not snap.get("role_summary", {}).get("summary", "").is_empty(), "diagnostics include role summary") and ok
	ok = _check(snap.get("turn_order", []).size() >= 6, "diagnostics include full turn order") and ok

	var logs_before_ai = controller.log_entries.size()
	controller.end_turn()
	ok = _check(controller.awaiting_facing, "human end turn enters facing confirmation") and ok
	controller.confirm_facing("E")
	ok = _check(controller.log_entries.size() > logs_before_ai, "AI turn logs an action or wait after facing confirmation") and ok
	ok = _check(controller.active_unit() != null and controller.active_unit().control == "human", "turn returns to next human/visible actor after AI resolves") and ok
	ok = _check(not controller.recent_battle_event().is_empty(), "recent battle event is preserved after AI resolves") and ok
	ok = _check(not controller.recent_battle_event().get("summary", "").is_empty(), "recent battle event has readable summary") and ok
	ok = _check(controller.diagnostics_snapshot().get("turn_order", [])[0].contains("CT"), "diagnostics expose CT turn order") and ok
	ok = _check(active.last_turn_recovery > 0, "completed unit stores CT recovery") and ok

	var visibility_controller = BattleControllerScript.new()
	visibility_controller.setup_from_run("quick_parity")
	var visibility_active = visibility_controller.active_unit()
	visibility_active.sight_range = 1
	visibility_controller._refresh_visibility()
	ok = _check(visibility_controller.target_preview_for_active("attack").is_empty(), "unseen enemies are not legal targets") and ok
	ok = _check(visibility_controller.player_explored_positions().size() > 0, "visibility tracks explored tiles") and ok

	var water_controller = BattleControllerScript.new()
	water_controller.setup_from_run("quick_parity")
	ok = _check(water_controller.try_move_active(Vector2i(1, 3)).get("ok", false), "standable water can be entered") and ok
	ok = _check(not water_controller.try_action_active_at("attack", Vector2i(5, 0)).get("ok", true), "water terrain blocks attacks") and ok
	ok = _check(water_controller.last_invalid_reason == "terrain-action-blocked", "water action lockout reports terrain blocker") and ok

	var object_controller = BattleControllerScript.new()
	object_controller.setup_from_run("quick_parity")
	object_controller.active_unit().sight_range = 99
	object_controller._refresh_visibility()
	object_controller.set_mode("skill")
	var has_tree_target = object_controller.target_preview_for_active("skill").any(func(preview): return preview.get("pos", Vector2i(-1, -1)) == Vector2i(3, 3))
	ok = _check(has_tree_target, "targetable tree appears in skill previews") and ok
	var before_tree = int(object_controller.grid.object_at(Vector2i(3, 3)).get("durability", 0))
	ok = _check(object_controller.try_action_active_at("skill", Vector2i(3, 3)).get("ok", false), "skill can damage targetable tree") and ok
	ok = _check(int(object_controller.grid.object_at(Vector2i(3, 3)).get("durability", 0)) < before_tree, "tree durability decreases after hit") and ok

	var hit_controller = BattleControllerScript.new()
	hit_controller.setup_from_run("quick_parity")
	hit_controller.active_unit().sight_range = 99
	hit_controller.active_unit().grid_pos = Vector2i(3, 2)
	hit_controller._refresh_visibility()
	hit_controller.set_mode("skill")
	var unit_target_previews = hit_controller.target_preview_for_active("skill").filter(func(preview): return preview.get("unit") != null)
	if not unit_target_previews.is_empty():
		var unit_target_tile = unit_target_previews[0].get("pos")
		var hit_forecast = hit_controller.selected_action_forecast("skill", unit_target_tile)
		ok = _check(int(hit_forecast.get("hit_chance", 0)) > 0, "forecast includes hit chance when target is available") and ok
		hit_controller.forced_hit_roll = 100
		var hit_result = hit_controller.try_action_active_at("skill", unit_target_tile)
		ok = _check(hit_result.get("ok", false), "forced miss action still resolves command") and ok
		ok = _check(bool(hit_result.get("result", {}).get("missed", false)), "forced high roll produces miss result") and ok
	else:
		ok = _check(false, "unit target is available for hit chance test") and ok

	controller.turn_count = controller.late_threshold
	var hp_before_pressure = controller.units_for_team("player")[0].hp
	controller._apply_endgame_pressure()
	ok = _check(controller.units_for_team("player")[0].hp < hp_before_pressure, "pressure damage changes HP") and ok
	ok = _check(controller.recent_battle_event().get("kind", "") == "pressure", "pressure damage is attributed as pressure event") and ok

	for enemy in controller.units_for_team("enemy"):
		enemy.hp = 0
	controller._check_outcome()
	ok = _check(RunState.outcome == "victory", "victory outcome is stored in run state") and ok
	ok = _check(RunState.rewards.has("module-cache"), "result rewards are stored") and ok

	if ok:
		print("SMOKE CHECK PASSED")
		get_tree().quit(0)
	else:
		print("SMOKE CHECK FAILED")
		get_tree().quit(1)

func _find_different_destination(preview: Array, fallback: Vector2i) -> Vector2i:
	for item in preview:
		var pos: Vector2i = item.get("pos", fallback)
		if pos != fallback:
			return pos
	return fallback + Vector2i(1, 0)

func _check(condition: bool, label: String) -> bool:
	if condition:
		print("[ok] %s" % label)
	else:
		push_error("[fail] %s" % label)
	return condition
