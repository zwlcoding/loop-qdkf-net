extends RefCounted
class_name BattleController

signal changed
signal finished(result)

const ActionResolverScript = preload("res://scripts/battle/action_resolver.gd")
const AiPlannerScript = preload("res://scripts/battle/ai_planner.gd")
const GridMapScript = preload("res://scripts/battle/grid_map.gd")
const BattleUnitScript = preload("res://scripts/battle/battle_unit.gd")
const CT_THRESHOLD = 100
const RECOVERY_WAIT = 45
const RECOVERY_MOVE = 70
const RECOVERY_TOOL = 80
const RECOVERY_ACTION = 100
const RECOVERY_MOVE_ACTION = 120
const RECOVERY_COMBO = 130

var grid = GridMapScript.new()
var units: Array = []
var turn_order: Array = []
var active_index = 0
var current_active = null
var turn_sequence = 0
var awaiting_facing = false
var selected_facing = "S"
var explored_by_group = {}
var visible_by_group = {}
var player_visibility_group = "player"
var hit_roll_seed = 17
var forced_hit_roll = -1
var combo_resource = 3
var log_entries: Array = []
var mission = {}
var map_data = {}
var battle_setup = {}
var validation_errors: Array = []
var outcome = "pending"
var turn_count = 1
var late_threshold = 12
var current_mode = "move"
var selected_module_id = ""
var selected_tile = Vector2i(-1, -1)
var hovered_tile = Vector2i(-1, -1)
var selected_path: Array = []
var last_invalid_reason = ""
var last_feedback_message = ""
var last_command_result = {}
var battle_events: Array = []
var recent_event: Dictionary = {}
var _event_sequence = 0
var mission_state = {
	"objective_complete": false,
	"extraction_unlocked": false,
	"pressure_stage": 0,
	"collapsed": false,
	"objective_text": "Recover the relic or defeat the opposing squad."
}

func setup_from_run(fixture_id: String = "") -> void:
	validation_errors.clear()
	outcome = "pending"
	turn_count = 1
	turn_sequence = 0
	current_active = null
	awaiting_facing = false
	selected_facing = "S"
	explored_by_group.clear()
	visible_by_group.clear()
	combo_resource = 3
	last_invalid_reason = ""
	last_feedback_message = ""
	last_command_result = {}
	battle_events.clear()
	recent_event.clear()
	_event_sequence = 0
	selected_module_id = ""
	selected_path.clear()
	mission_state = {
		"objective_complete": false,
		"extraction_unlocked": false,
		"pressure_stage": 0,
		"collapsed": false,
		"objective_text": "夺回遗物或击败敌方小队。"
	}
	var setup = _resolve_battle_setup(fixture_id)
	_override_player_squad(setup)
	battle_setup = setup
	var map_id: String = setup.get("map_id", RunState.current_map_id)
	if map_id.is_empty():
		map_id = ContentRegistry.first_id("maps")
	map_data = ContentRegistry.by_id("maps", map_id)
	var mission_id: String = setup.get("mission_id", RunState.current_mission_id)
	mission = ContentRegistry.by_id("missions", mission_id)
	if mission.is_empty():
		mission = ContentRegistry.by_id("missions", ContentRegistry.first_id("missions"))
	late_threshold = int(mission.get("late_threshold", 12))
	grid.load_from_data(map_data, ContentRegistry.get_items("terrain"))
	validation_errors = validate_setup(setup, map_data)
	if not validation_errors.is_empty():
		for error in validation_errors:
			append_log("Validation: %s" % error)
		return
	_create_units_from_setup(setup)
	_initialize_visibility_groups(setup)
	_initialize_tempo()
	_refresh_visibility()
	_start_active_turn()
	append_log("任务: %s" % mission.get("name", "Unknown"))
	changed.emit()

func _override_player_squad(setup: Dictionary) -> void:
	GameState.ensure_squad()
	var squads: Array = setup.get("squads", [])
	for squad in squads:
		if squad.get("control", "") != "human":
			continue
		var source_map = ContentRegistry.by_id("maps", setup.get("map_id", ""))
		var player_starts: Array = source_map.get("player_starts", [])
		var units: Array = []
		for i in range(GameState.selected_squad.size()):
			var raw_pos = player_starts[i] if i < player_starts.size() else {"x": i, "y": 0}
			units.append({
				"id": "a_%s_%s" % [GameState.selected_squad[i], i],
				"label": "",
				"chassis": GameState.selected_squad[i],
				"x": int(raw_pos.get("x", 0)),
				"y": int(raw_pos.get("y", 0)),
				"modules": _default_modules_for_chassis(GameState.selected_squad[i])
			})
		squad["units"] = units
		break

func _default_modules_for_chassis(chassis_id: String) -> Array:
	match chassis_id:
		"support":
			return ["strike", "heal", "rift_combo", "field_kit"]
		"controller":
			return ["strike", "root_shot", "rift_combo", "field_kit"]
		"caster":
			return ["strike", "fireball", "rift_combo", "field_kit"]
		"skirmisher":
			return ["strike", "root_shot", "rift_combo", "field_kit"]
	return ["strike", "shield_bash", "rift_combo", "field_kit"]

func _resolve_battle_setup(fixture_id: String) -> Dictionary:
	var fixtures = ContentRegistry.get_items("fixtures")
	var wanted = fixture_id
	if wanted.is_empty():
		wanted = "quick_parity"
	for fixture in fixtures:
		if fixture.get("id", "") == wanted and fixture.has("battle_setup"):
			return fixture.get("battle_setup", {})
	for fixture in fixtures:
		if fixture.has("battle_setup") and (RunState.current_map_id.is_empty() or fixture.get("map_id", "") == RunState.current_map_id):
			return fixture.get("battle_setup", {})
	return _legacy_setup_from_run()

func _legacy_setup_from_run() -> Dictionary:
	var map_id = RunState.current_map_id
	if map_id.is_empty():
		map_id = ContentRegistry.first_id("maps")
	var mission_id = RunState.current_mission_id
	if mission_id.is_empty():
		mission_id = ContentRegistry.first_id("missions")
	var source_map = ContentRegistry.by_id("maps", map_id)
	var player_starts: Array = source_map.get("player_starts", [])
	var enemy_defs: Array = source_map.get("enemies", [])
	GameState.ensure_squad()
	var alpha_units: Array = []
	for i in range(GameState.selected_squad.size()):
		var raw_pos = player_starts[i] if i < player_starts.size() else {"x": i, "y": 0}
		alpha_units.append({
			"id": "a_%s_%s" % [GameState.selected_squad[i], i],
			"label": "甲队%s" % (i + 1),
			"chassis": GameState.selected_squad[i],
			"x": int(raw_pos.get("x", 0)),
			"y": int(raw_pos.get("y", 0)),
			"modules": ["strike", "shield_bash", "rift_combo", "field_kit"]
		})
	var bravo_units: Array = []
	for i in range(enemy_defs.size()):
		var enemy = enemy_defs[i]
		bravo_units.append({
			"id": "b_%s_%s" % [enemy.get("chassis", "unit"), i],
			"label": "乙队%s" % (i + 1),
			"chassis": enemy.get("chassis", "vanguard"),
			"x": int(enemy.get("x", 0)),
			"y": int(enemy.get("y", 0)),
			"modules": ["strike", "rift_combo", "field_kit"]
		})
	return {
		"id": "legacy_run",
		"mission_id": mission_id,
		"map_id": map_id,
		"squads": [
			{"id": 0, "name": "甲队", "team": "player", "control": "human", "units": alpha_units},
			{"id": 1, "name": "乙队", "team": "enemy", "control": "ai", "units": bravo_units}
		]
	}

func validate_setup(setup: Dictionary, source_map: Dictionary) -> Array:
	var errors: Array = []
	var chassis_ids = _id_set(ContentRegistry.get_items("chassis"))
	var module_ids = _id_set(ContentRegistry.get_items("modules"))
	var seen_units = {}
	var seen_tiles = {}
	if setup.get("squads", []).is_empty():
		errors.append("setup has no squads")
	for squad in setup.get("squads", []):
		if not squad.has("id"):
			errors.append("squad missing id")
		if not ["human", "ai"].has(squad.get("control", "")):
			errors.append("squad %s has invalid control" % squad.get("id", "?"))
		for unit in squad.get("units", []):
			var unit_id: String = unit.get("id", "")
			if unit_id.is_empty():
				errors.append("unit missing id")
			elif seen_units.has(unit_id):
				errors.append("duplicate unit id: %s" % unit_id)
			seen_units[unit_id] = true
			var chassis_id: String = unit.get("chassis", "")
			if not chassis_ids.has(chassis_id):
				errors.append("unit %s references missing chassis %s" % [unit_id, chassis_id])
			var pos = Vector2i(int(unit.get("x", -1)), int(unit.get("y", -1)))
			if not grid.in_bounds(pos):
				errors.append("unit %s spawn out of bounds: %s,%s" % [unit_id, pos.x, pos.y])
			elif not grid.is_passable(pos):
				errors.append("unit %s spawn impassable: %s,%s" % [unit_id, pos.x, pos.y])
			var tile_key = "%s,%s" % [pos.x, pos.y]
			if seen_tiles.has(tile_key):
				errors.append("duplicate occupied spawn tile: %s" % tile_key)
			seen_tiles[tile_key] = true
			for module_id in unit.get("modules", []):
				if not module_ids.has(module_id):
					errors.append("unit %s references missing module %s" % [unit_id, module_id])
	if source_map.get("cells", []).is_empty():
		errors.append("map has no cells")
	var has_objective = false
	for cell in source_map.get("cells", []):
		if not String(cell.get("objective", "")).is_empty():
			has_objective = true
			break
	if not has_objective:
		errors.append("map has no objective cells")
	return errors

func _id_set(items: Array) -> Dictionary:
	var result = {}
	for item in items:
		result[item.get("id", "")] = true
	return result

func _create_units_from_setup(setup: Dictionary) -> void:
	units.clear()
	for squad in setup.get("squads", []):
		for unit_def in squad.get("units", []):
			var chassis = ContentRegistry.by_id("chassis", unit_def.get("chassis", ""))
			var pos = Vector2i(int(unit_def.get("x", 0)), int(unit_def.get("y", 0)))
			units.append(_unit_from_chassis(chassis, squad, unit_def, pos))

func _unit_from_chassis(chassis: Dictionary, squad: Dictionary, unit_def: Dictionary, position: Vector2i):
	var unit = BattleUnitScript.new()
	unit.id = unit_def.get("id", chassis.get("id", "unit"))
	unit.label = chassis.get("name", unit_def.get("label", unit.id))
	unit.name = chassis.get("name", unit.id)
	unit.team = squad.get("team", "neutral")
	unit.squad_id = int(squad.get("id", -1))
	unit.squad_name = squad.get("name", "")
	unit.control = squad.get("control", "human")
	unit.chassis_id = chassis.get("id", unit_def.get("chassis", ""))
	unit.role = chassis.get("role", unit.chassis_id)
	unit.max_hp = int(chassis.get("hp", 20))
	unit.hp = unit.max_hp
	unit.attack = int(chassis.get("attack", 5))
	unit.defense = int(chassis.get("defense", 1))
	unit.move = int(chassis.get("move", 3))
	unit.jump = int(chassis.get("jump", 1))
	unit.speed = int(chassis.get("speed", 5))
	unit.readiness = int(unit_def.get("readiness", 0))
	unit.sight_range = int(unit_def.get("sight_range", chassis.get("sight_range", 6)))
	unit.visibility_group = String(unit_def.get("visibility_group", squad.get("visibility_group", unit.team)))
	unit.modules = unit_def.get("modules", ["strike", "rift_combo", "field_kit"]).duplicate()
	unit.grid_pos = position
	unit.facing = "N" if unit.team == "enemy" else "S"
	return unit

func _initialize_visibility_groups(setup: Dictionary) -> void:
	player_visibility_group = "player"
	hit_roll_seed = 17
	forced_hit_roll = -1
	for squad in setup.get("squads", []):
		var group = String(squad.get("visibility_group", squad.get("team", "neutral")))
		if squad.get("control", "") == "human":
			player_visibility_group = group
		if not explored_by_group.has(group):
			explored_by_group[group] = {}
		if not visible_by_group.has(group):
			visible_by_group[group] = {}
	for unit in units:
		if unit.visibility_group.is_empty():
			unit.visibility_group = unit.team
		if not explored_by_group.has(unit.visibility_group):
			explored_by_group[unit.visibility_group] = {}
		if not visible_by_group.has(unit.visibility_group):
			visible_by_group[unit.visibility_group] = {}

func _initialize_tempo() -> void:
	for unit in units:
		unit.turn_active = false
		unit.last_turn_recovery = 0
		if unit.readiness <= 0:
			unit.readiness = int(unit.speed)
	active_index = 0
	_select_next_active()

func _rebuild_turn_order() -> void:
	turn_order = units.filter(func(unit): return unit.is_alive())
	turn_order.sort_custom(func(a, b):
		if a == current_active:
			return true
		if b == current_active:
			return false
		if a.readiness == b.readiness:
			if a.speed == b.speed:
				return a.squad_id < b.squad_id
			return a.speed > b.speed
		return a.readiness > b.readiness
	)
	active_index = clamp(active_index, 0, max(0, turn_order.size() - 1))

func active_unit():
	if current_active != null and current_active.is_alive():
		return current_active
	_select_next_active()
	return current_active

func _select_next_active() -> void:
	var alive = units.filter(func(unit): return unit.is_alive())
	if alive.is_empty():
		current_active = null
		turn_order.clear()
		return
	var guard = 0
	while alive.all(func(unit): return int(unit.readiness) < CT_THRESHOLD) and guard < 100:
		guard += 1
		for unit in alive:
			unit.readiness += max(1, int(unit.speed))
	_rebuild_turn_order()
	current_active = turn_order[0] if not turn_order.is_empty() else null

func _start_active_turn() -> void:
	var unit = active_unit()
	if unit == null:
		return
	unit.reset_turn_flags()
	current_mode = "move"
	selected_module_id = ""
	selected_path.clear()
	awaiting_facing = false
	selected_facing = unit.facing
	_refresh_visibility()
	_rebuild_turn_order()
	append_log("回合: %s" % unit.display_name())
	_record_event({
		"kind": "turn",
		"source": unit,
		"action_label": "回合开始",
		"summary": "轮到%s行动" % unit.display_name()
	}, false, false)
	if unit.control == "human" and last_feedback_message.is_empty():
		last_feedback_message = "轮到%s行动" % unit.display_name()
	if unit.control == "ai":
		_execute_ai_turn(unit)

func set_mode(next_mode: String) -> void:
	current_mode = next_mode
	selected_module_id = _default_module_id_for_mode(active_unit(), current_mode)
	last_invalid_reason = ""
	changed.emit()

func set_selected_module(module_id: String) -> bool:
	for module in available_modules_for_mode(current_mode, active_unit()):
		if module.get("id", "") == module_id:
			selected_module_id = module_id
			last_invalid_reason = ""
			changed.emit()
			return true
	return false

func selected_action_category() -> String:
	return current_mode

func available_modules_for_mode(mode: String, unit = null) -> Array:
	var use_unit = active_unit() if unit == null else unit
	if use_unit == null:
		return []
	var module_defs = ContentRegistry.get_items("modules")
	match mode:
		"skill":
			var result: Array = []
			for module in use_unit.modules_for_kind("attack", module_defs):
				if module.get("id", "") != "strike":
					result.append(module)
			result.append_array(use_unit.modules_for_kind("heal", module_defs))
			return result
		"tool":
			return use_unit.modules_for_kind("item", module_defs)
		"combo":
			return use_unit.modules_for_kind("combo", module_defs)
	return []

func _default_module_id_for_mode(unit, mode: String) -> String:
	var modules = available_modules_for_mode(mode, unit)
	if modules.is_empty():
		return ""
	return modules[0].get("id", "")

func selected_module_definition(mode: String = "") -> Dictionary:
	var use_mode = current_mode if mode.is_empty() else mode
	var selected_id = selected_module_id
	if selected_id.is_empty() or use_mode != current_mode:
		selected_id = _default_module_id_for_mode(active_unit(), use_mode)
	for module in available_modules_for_mode(use_mode, active_unit()):
		if module.get("id", "") == selected_id:
			return module
	return {}

func movement_preview_for(unit) -> Array:
	if unit == null or not unit.can_move():
		return []
	return grid.reachable(unit.grid_pos, unit.move, unit.jump, units)

func movement_preview_for_active() -> Array:
	return movement_preview_for(active_unit())

func reachable_for_active() -> Array:
	return movement_preview_for_active().map(func(item): return item.get("pos", Vector2i(-1, -1)))

func preview_positions(mode: String = "") -> Array:
	var use_mode = current_mode if mode.is_empty() else mode
	if use_mode == "move":
		return movement_preview_for_active().map(func(item): return item.get("pos", Vector2i(-1, -1)))
	return target_preview_for_active(use_mode).map(func(item): return item.get("pos", Vector2i(-1, -1)))

func action_range_positions_for_active(mode: String = "") -> Array:
	var unit = active_unit()
	if unit == null:
		return []
	var use_mode = current_mode if mode.is_empty() else mode
	if use_mode == "move":
		return movement_preview_for_active().map(func(item): return item.get("pos", Vector2i(-1, -1)))
	var range_value = _range_for_mode(unit, use_mode)
	if range_value <= 0:
		return []
	var result: Array = []
	for pos in grid.all_positions():
		if pos == unit.grid_pos:
			continue
		if grid.distance(unit.grid_pos, pos) <= range_value:
			result.append(pos)
	return result

func selected_module_summary(mode: String = "") -> Dictionary:
	var use_mode = current_mode if mode.is_empty() else mode
	var unit = active_unit()
	var target_count = target_preview_for_active(use_mode).size()
	var range_count = action_range_positions_for_active(use_mode).size()
	if use_mode == "move":
		return {
			"mode": use_mode,
			"name": "移动",
			"range": unit.move if unit else 0,
			"target_rule": "可到达格",
			"effect": "移动到高亮格",
			"role": active_role_summary().get("title", ""),
			"unavailable_reason": unavailable_reason_for_mode(use_mode),
			"target_count": target_count,
			"range_count": range_count
		}
	if use_mode == "attack":
		return {
			"mode": use_mode,
			"name": "基础攻击",
			"range": 1,
			"target_rule": "敌方",
			"effect": "造成武器伤害",
			"role": active_role_summary().get("title", ""),
			"unavailable_reason": unavailable_reason_for_mode(use_mode),
			"target_count": target_count,
			"range_count": range_count
		}
	var module = selected_module_definition(use_mode)
	if module.is_empty():
		return {
			"mode": use_mode,
			"name": _mode_label(use_mode),
			"range": 0,
			"target_rule": "无可用模块",
			"effect": "",
			"role": active_role_summary().get("title", ""),
			"unavailable_reason": unavailable_reason_for_mode(use_mode),
			"target_count": target_count,
			"range_count": range_count
		}
	return {
		"mode": use_mode,
		"id": module.get("id", ""),
		"name": module.get("name", module.get("id", "")),
		"range": int(module.get("range", 1)),
		"target_rule": _module_target_rule(module, use_mode),
		"line_of_sight": bool(module.get("line_of_sight", false)),
		"cost": int(module.get("cost", 0)),
		"effect": _module_effect_summary(module, use_mode),
		"role": active_role_summary().get("title", ""),
		"unavailable_reason": unavailable_reason_for_mode(use_mode),
		"target_count": target_count,
		"range_count": range_count
	}

func selected_action_forecast(mode: String = "", tile: Vector2i = Vector2i(-1, -1)) -> Dictionary:
	var use_mode = current_mode if mode.is_empty() else mode
	var unit = active_unit()
	if unit == null:
		return _forecast_blocked(use_mode, "没有当前单位")
	if use_mode == "move":
		return {
			"mode": use_mode,
			"action_label": "移动",
			"source_name": unit.display_name(),
			"range": unit.move,
			"summary": "预判: 移动到高亮格，消耗移动机会"
		}
	var previews = target_preview_for_unit(unit, use_mode)
	var chosen = _choose_forecast_preview(previews, tile)
	if chosen.is_empty():
		var reason = unavailable_reason_for_mode(use_mode)
		if reason.is_empty():
			reason = _target_blocker_for_mode(unit, use_mode)
		return _forecast_blocked(use_mode, reason)
	var target = chosen.get("unit")
	var action = chosen.get("action", {})
	if action.get("type", "") == "object":
		return _forecast_for_object_action(unit, chosen.get("pos", unit.grid_pos), action, use_mode)
	return _forecast_for_action(unit, target, action, use_mode)

func _forecast_for_object_action(unit, tile: Vector2i, action: Dictionary, mode: String) -> Dictionary:
	var module = action.get("module", {})
	var object = action.get("object", grid.object_at(tile))
	var damage = max(1, unit.attack + int(module.get("power", 0)))
	var remaining = max(0, int(object.get("durability", 0)) - damage)
	return {
		"mode": mode,
		"type": "object",
		"action_label": "破坏",
		"source_id": unit.id,
		"source_name": unit.display_name(),
		"target_name": object.get("kind", "障碍物"),
		"damage": damage,
		"summary": "预判: 破坏 -> %s | 耐久伤害%s | 剩余%s" % [object.get("kind", "障碍物"), damage, remaining]
	}

func active_role_summary() -> Dictionary:
	var unit = active_unit()
	if unit == null:
		return {}
	var module_names: Array = []
	for module_id in unit.modules:
		var module = _module_by_id(module_id)
		if not module.is_empty():
			module_names.append(module.get("name", module_id))
	var summary = _role_summary_for_unit(unit)
	return {
		"unit": unit.display_name(),
		"role": summary.get("role", unit.role),
		"title": summary.get("title", unit.role),
		"summary": summary.get("summary", ""),
		"modules": module_names
	}

func recent_battle_event() -> Dictionary:
	return recent_event.duplicate(true)

func battle_event_log() -> Array:
	return battle_events.duplicate(true)

func unavailable_reason_for_mode(mode: String = "") -> String:
	var use_mode = current_mode if mode.is_empty() else mode
	var unit = active_unit()
	if unit == null:
		return "没有当前单位"
	if awaiting_facing and use_mode != "move":
		return "请选择结束朝向"
	if unit.control != "human":
		return "等待电脑行动"
	if use_mode == "move":
		return "" if unit.can_move() else "移动机会已用"
	if grid.action_blocked_at(unit.grid_pos, use_mode):
		return "当前地形禁止%s" % _mode_label(use_mode)
	if use_mode == "tool" and not unit.can_use_tool():
		return "道具机会已用"
	if ["attack", "skill", "combo"].has(use_mode) and not unit.can_act():
		return "行动机会已用"
	if use_mode == "combo":
		var combo_module = selected_module_definition(use_mode)
		var combo_cost = int(combo_module.get("cost", 1)) if not combo_module.is_empty() else 1
		if combo_resource < combo_cost:
			return "连携值不足"
	if ["skill", "tool", "combo"].has(use_mode) and available_modules_for_mode(use_mode, unit).is_empty():
		return "没有可用%s模块" % _mode_label(use_mode)
	if use_mode != "move" and target_preview_for_active(use_mode).is_empty():
		return _target_blocker_for_mode(unit, use_mode)
	return ""

func target_preview_for_active(mode: String = "") -> Array:
	var unit = active_unit()
	if unit == null:
		return []
	var use_mode = current_mode if mode.is_empty() else mode
	return target_preview_for_unit(unit, use_mode)

func target_preview_for_unit(unit, mode: String) -> Array:
	var result: Array = []
	if unit == null or not unit.is_alive():
		return result
	var module_defs = ContentRegistry.get_items("modules")
	for target in units:
		if not target.is_alive() or target == unit:
			continue
		var action = _action_for_target(unit, target, mode, module_defs)
		if not action.is_empty():
			result.append({"pos": target.grid_pos, "unit": target, "action": action})
	result.append_array(_object_target_previews_for_unit(unit, mode))
	if mode == "interact":
		var objective = grid.objective_at(unit.grid_pos)
		if not objective.is_empty():
			result.append({"pos": unit.grid_pos, "unit": unit, "action": {"type": "interact", "objective": objective}})
	return result

func _object_target_previews_for_unit(unit, mode: String) -> Array:
	var result: Array = []
	if not ["attack", "skill"].has(mode) or grid.action_blocked_at(unit.grid_pos, mode):
		return result
	var module = selected_module_definition(mode)
	var range_value = 1 if mode == "attack" else int(module.get("range", 1))
	for pos in grid.all_positions():
		if not grid.object_is_targetable(pos):
			continue
		if grid.distance(unit.grid_pos, pos) > range_value:
			continue
		if mode == "skill" and bool(module.get("line_of_sight", false)) and not grid.has_projectile_path(unit.grid_pos, pos):
			continue
		result.append({
			"pos": pos,
			"unit": null,
			"action": {"type": "object", "mode": mode, "module": module, "module_id": module.get("id", "strike"), "object": grid.object_at(pos)}
		})
	return result

func _refresh_visibility() -> void:
	for group in visible_by_group.keys():
		visible_by_group[group] = {}
	for unit in units:
		if not unit.is_alive():
			continue
		var group = unit.visibility_group
		if not visible_by_group.has(group):
			visible_by_group[group] = {}
		if not explored_by_group.has(group):
			explored_by_group[group] = {}
		for pos in grid.all_positions():
			if grid.distance(unit.grid_pos, pos) <= unit.sight_range and grid.has_line_of_sight(unit.grid_pos, pos):
				var key = grid._key(pos)
				visible_by_group[group][key] = true
				explored_by_group[group][key] = true

func is_tile_visible_to_group(pos: Vector2i, group: String = "") -> bool:
	var use_group = player_visibility_group if group.is_empty() else group
	return visible_by_group.get(use_group, {}).has(grid._key(pos))

func is_tile_explored_by_group(pos: Vector2i, group: String = "") -> bool:
	var use_group = player_visibility_group if group.is_empty() else group
	return explored_by_group.get(use_group, {}).has(grid._key(pos))

func is_unit_visible_to_unit(observer, target) -> bool:
	if observer == null or target == null:
		return false
	if observer.team == target.team:
		return true
	return is_tile_visible_to_group(target.grid_pos, observer.visibility_group)

func player_visible_positions() -> Array:
	return _positions_from_visibility(visible_by_group.get(player_visibility_group, {}))

func player_explored_positions() -> Array:
	return _positions_from_visibility(explored_by_group.get(player_visibility_group, {}))

func _positions_from_visibility(source: Dictionary) -> Array:
	var result: Array = []
	for key in source.keys():
		var parts = String(key).split(",")
		if parts.size() == 2:
			result.append(Vector2i(int(parts[0]), int(parts[1])))
	return result

func _action_for_target(unit, target, mode: String, module_defs: Array) -> Dictionary:
	var hostile = unit.team != target.team
	var distance = grid.distance(unit.grid_pos, target.grid_pos)
	var selected_module = selected_module_definition(mode)
	if hostile and not is_unit_visible_to_unit(unit, target):
		return {}
	if mode != "move" and grid.action_blocked_at(unit.grid_pos, mode):
		return {}
	if mode == "attack":
		if hostile and unit.can_act() and distance <= 1:
			return {"type": "attack", "module_id": "strike", "range": 1}
	if mode == "skill":
		if not unit.can_act():
			return {}
		for module in unit.modules_for_kind("attack", module_defs):
			if module.get("id", "") == "strike":
				continue
			if not selected_module.is_empty() and module.get("id", "") != selected_module.get("id", ""):
				continue
			if not hostile:
				continue
			if distance > int(module.get("range", 1)):
				continue
			if bool(module.get("line_of_sight", false)) and not grid.has_projectile_path(unit.grid_pos, target.grid_pos):
				continue
			return {"type": "skill", "module": module, "module_id": module.get("id", "")}
		for module in unit.modules_for_kind("heal", module_defs):
			if not selected_module.is_empty() and module.get("id", "") != selected_module.get("id", ""):
				continue
			if hostile:
				continue
			if target.hp < target.max_hp and distance <= int(module.get("range", 1)):
				return {"type": "heal", "module": module, "module_id": module.get("id", "")}
	if mode == "tool":
		if not unit.can_use_tool():
			return {}
		for module in unit.modules_for_kind("item", module_defs):
			if not selected_module.is_empty() and module.get("id", "") != selected_module.get("id", ""):
				continue
			if not hostile and target.hp < target.max_hp and distance <= int(module.get("range", 1)):
				return {"type": "tool", "module": module, "module_id": module.get("id", "")}
	if mode == "combo":
		if hostile and unit.can_act() and combo_resource > 0:
			for module in unit.modules_for_kind("combo", module_defs):
				if not selected_module.is_empty() and module.get("id", "") != selected_module.get("id", ""):
					continue
				if distance <= int(module.get("range", 1)) and combo_resource >= int(module.get("cost", 1)):
					return {"type": "combo", "module": module, "module_id": module.get("id", ""), "cost": int(module.get("cost", 1))}
	return {}

func move_active(tile: Vector2i) -> bool:
	return try_move_active(tile).get("ok", false)

func try_move_active(tile: Vector2i) -> Dictionary:
	var unit = active_unit()
	selected_tile = tile
	if unit == null:
		return _reject("no-active-unit")
	if unit.control != "human":
		return _reject("wrong-turn")
	if not unit.can_move():
		return _reject("movement-spent")
	return _try_move_unit(unit, tile)

func _try_move_unit(unit, tile: Vector2i) -> Dictionary:
	for candidate in movement_preview_for(unit):
		if candidate.get("pos") == tile:
			var old_pos = unit.grid_pos
			unit.grid_pos = tile
			unit.moved = true
			selected_path = candidate.get("path", []).duplicate()
			_update_facing_from_movement(unit, old_pos, tile)
			var message = "%s 移动到 %s,%s" % [unit.display_name(), tile.x, tile.y]
			append_log(message)
			last_command_result = {"ok": true, "type": "move", "unit": unit.id, "path": selected_path, "message": message}
			last_invalid_reason = ""
			last_feedback_message = message
			changed.emit()
			return last_command_result
	var reason = grid.move_rejection_reason(unit.grid_pos, tile, unit.move, unit.jump, units)
	if unit.moved:
		reason = "movement-spent"
	return _reject(reason)

func attack_active_at(tile: Vector2i) -> bool:
	return try_action_active_at("attack", tile).get("ok", false)

func combo_active_at(tile: Vector2i) -> bool:
	return try_action_active_at("combo", tile).get("ok", false)

func try_action_active_at(mode: String, tile: Vector2i) -> Dictionary:
	var unit = active_unit()
	selected_tile = tile
	if unit == null:
		return _reject("no-active-unit")
	if unit.control != "human":
		return _reject("wrong-turn")
	return _try_action_unit_at(unit, mode, tile)

func _try_action_unit_at(unit, mode: String, tile: Vector2i) -> Dictionary:
	if awaiting_facing and unit.control == "human":
		return _reject("facing-required")
	if grid.action_blocked_at(unit.grid_pos, mode):
		return _reject("terrain-action-blocked")
	for preview in target_preview_for_unit(unit, mode):
		if preview.get("pos") == tile:
			var target = preview.get("unit")
			var action = preview.get("action", {})
			if action.get("type", "") == "object":
				var object_result = _resolve_object_action(unit, tile, action)
				_check_outcome()
				changed.emit()
				return object_result
			var result = _resolve_action(unit, target, action)
			_check_outcome()
			changed.emit()
			return result
	if mode == "tool" and not unit.can_use_tool():
		return _reject("tool-spent")
	if ["attack", "skill", "combo"].has(mode) and not unit.can_act():
		return _reject("action-spent")
	var unavailable = unavailable_reason_for_mode(mode)
	if not unavailable.is_empty():
		return _reject(unavailable)
	return _reject("invalid-target")

func _resolve_action(unit, target, action: Dictionary) -> Dictionary:
	var result = {}
	var action_label = "行动"
	var event_kind = action.get("type", "action")
	var power_bonus = 0
	var knock = {}
	var hit = _hit_for_action(unit, target, action)
	if ["attack", "skill", "combo"].has(action.get("type", "")) and not bool(hit.get("hit", true)):
		unit.acted = true
		if action.get("type", "") == "combo":
			var combo_module = action.get("module", {})
			combo_resource = max(0, combo_resource - int(action.get("cost", combo_module.get("cost", 1))))
		action_label = _action_label_for_miss(action)
		result = {
			"type": action.get("type", ""),
			"attacker": unit.id,
			"defender": target.id,
			"damage": 0,
			"missed": true,
			"hit_chance": hit.get("chance", 0),
			"roll": hit.get("roll", 0),
			"facing_arc": hit.get("arc", "")
		}
		append_log("%s 对%s使用%s 未命中" % [unit.display_name(), target.display_name(), action_label])
		var miss_event = _record_event(_event_from_action(unit, target, action_label, event_kind, result, knock, action), true, false)
		last_command_result = {"ok": true, "type": action.get("type", ""), "unit": unit.id, "target": target.id, "result": result}
		last_invalid_reason = ""
		last_feedback_message = miss_event.get("summary", "未命中")
		AudioSettings.play_event(action.get("type", "action"))
		return last_command_result
	match action.get("type", ""):
		"attack":
			action_label = "基础攻击"
			result = ActionResolverScript.resolve_attack(unit, target, grid, action.get("module_id", "strike"), power_bonus)
			result.merge(hit, true)
			unit.acted = true
			knock = _apply_knockback_if_needed(unit, target, action)
			append_log("%s 攻击%s 造成%s点伤害" % [unit.display_name(), target.display_name(), result.get("damage", 0)])
		"skill":
			var module = action.get("module", {})
			action_label = module.get("name", "技能")
			power_bonus = int(module.get("power", 0))
			result = ActionResolverScript.resolve_attack(unit, target, grid, module.get("id", "skill"), power_bonus)
			result.merge(hit, true)
			unit.acted = true
			if module.has("status") and target.is_alive():
				target.add_status(module.get("status", ""))
			knock = _apply_knockback_if_needed(unit, target, {"module": module})
			append_log("%s 对%s使用%s 造成%s点伤害" % [unit.display_name(), target.display_name(), module.get("name", "Skill"), result.get("damage", 0)])
		"heal", "tool":
			var heal_module = action.get("module", {})
			action_label = heal_module.get("name", "支援")
			var amount = int(heal_module.get("heal", 0))
			var healed = target.heal(amount)
			if action.get("type", "") == "tool":
				unit.tool_used = true
			else:
				unit.acted = true
			result = {"type": action.get("type", ""), "healing": healed, "target": target.id}
			append_log("%s 为%s恢复%s点生命" % [unit.display_name(), target.display_name(), healed])
		"combo":
			var combo_module = action.get("module", {})
			action_label = combo_module.get("name", "连携")
			result = ActionResolverScript.resolve_combo(unit, target, units_for_team(unit.team), grid)
			result.merge(hit, true)
			combo_resource = max(0, combo_resource - int(action.get("cost", combo_module.get("cost", 1))))
			unit.acted = true
			append_log("%s 连携攻击%s 造成%s点伤害" % [unit.display_name(), target.display_name(), result.get("damage", 0)])
	var event = _record_event(_event_from_action(unit, target, action_label, event_kind, result, knock, action), true, false)
	last_command_result = {"ok": true, "type": action.get("type", ""), "unit": unit.id, "target": target.id, "result": result}
	last_invalid_reason = ""
	last_feedback_message = event.get("summary", log_entries[-1] if not log_entries.is_empty() else "行动成功")
	AudioSettings.play_event(action.get("type", "action"))
	return last_command_result

func _resolve_object_action(unit, tile: Vector2i, action: Dictionary) -> Dictionary:
	var module = action.get("module", {})
	var power = int(module.get("power", 0))
	var damage = max(1, unit.attack + power)
	var object_result = grid.damage_object_at(tile, damage)
	unit.acted = true
	var object = object_result.get("object", action.get("object", {}))
	var object_name = object.get("kind", "障碍物")
	var message = "%s 攻击%s 造成%s点耐久伤害" % [unit.display_name(), object_name, damage]
	if bool(object_result.get("destroyed", false)):
		message += "并摧毁"
	append_log(message)
	_record_event({
		"kind": "object",
		"source": unit,
		"target": {"id": object.get("id", "object"), "name": object_name, "team": "neutral", "pos": tile},
		"action_label": "破坏",
		"damage": damage,
		"summary": message
	}, true, false)
	_refresh_visibility()
	last_command_result = {"ok": true, "type": "object", "unit": unit.id, "target": tile, "result": object_result}
	last_invalid_reason = ""
	last_feedback_message = message
	return last_command_result

func _action_label_for_miss(action: Dictionary) -> String:
	if action.get("type", "") == "attack":
		return "基础攻击"
	return action.get("module", {}).get("name", _mode_label(action.get("type", "")))

func _hit_for_action(unit, target, action: Dictionary) -> Dictionary:
	if not ["attack", "skill", "combo"].has(action.get("type", "")):
		return {"hit": true, "chance": 100, "roll": 0}
	var module = action.get("module", {})
	if action.get("type", "") == "attack":
		module = _module_by_id(action.get("module_id", "strike"))
	var forecast = ActionResolverScript.hit_forecast(unit, target, grid, module)
	var roll = _next_hit_roll()
	forecast["roll"] = roll
	forecast["hit"] = roll <= int(forecast.get("chance", 0))
	return forecast

func _next_hit_roll() -> int:
	if forced_hit_roll > 0:
		var roll = forced_hit_roll
		forced_hit_roll = -1
		return roll
	hit_roll_seed = int(fmod(float(hit_roll_seed * 1103515245 + 12345), 2147483647.0))
	return int(hit_roll_seed % 100) + 1

func _apply_knockback_if_needed(unit, target, action: Dictionary) -> Dictionary:
	var knockback = 0
	if action.has("module"):
		knockback = int(action.get("module", {}).get("knockback", 0))
	if knockback <= 0 and action.get("module_id", "") == "shield_bash":
		knockback = 1
	if knockback <= 0 or not target.is_alive():
		return {}
	var knock = ActionResolverScript.resolve_knockback(unit, target, grid, units, knockback)
	if knock.get("blocked", false):
		append_log("%s 撞击受到%s点伤害" % [target.display_name(), knock.get("collision_damage", 0)])
	elif knock.get("fall_damage", 0) > 0:
		append_log("%s 坠落受到%s点伤害" % [target.display_name(), knock.get("fall_damage", 0)])
	return knock

func interact_active() -> bool:
	var unit = active_unit()
	if unit == null or unit.control != "human":
		_reject("wrong-turn")
		return false
	return _try_interact_unit(unit).get("ok", false)

func _try_interact_unit(unit) -> Dictionary:
	var objective = grid.objective_at(unit.grid_pos)
	if objective == "relic":
		mission_state["objective_complete"] = true
		mission_state["extraction_unlocked"] = true
		combo_resource += 1
		append_log("%s 取得了遗物。撤离已解锁。" % unit.display_name())
		last_command_result = {"ok": true, "type": "interact", "objective": objective}
		changed.emit()
		return last_command_result
	if objective == "extraction":
		if not bool(mission_state.get("extraction_unlocked", false)):
			return _reject("extraction-locked")
		outcome = "extracted"
		_finish(["rift-shard", "field-data"], [], [unit.id])
		return {"ok": true, "type": "extract"}
	return _reject("no-objective")

func end_turn() -> void:
	var unit = active_unit()
	if unit and unit.control == "human" and not awaiting_facing:
		awaiting_facing = true
		current_mode = "facing"
		selected_facing = unit.facing
		last_invalid_reason = ""
		last_feedback_message = "选择结束朝向"
		changed.emit()
		return
	_complete_turn("manual")

func confirm_facing(facing: String) -> void:
	var unit = active_unit()
	if unit == null:
		return
	if not ["N", "E", "S", "W"].has(facing):
		_reject("invalid-facing")
		return
	unit.facing = facing
	selected_facing = facing
	awaiting_facing = false
	_complete_turn("facing")

func _complete_turn(reason: String = "") -> void:
	var unit = active_unit()
	if unit:
		if unit.control == "ai":
			unit.facing = _auto_facing_for_unit(unit)
		var recovery = _recovery_for_completed_turn(unit)
		unit.last_turn_recovery = recovery
		unit.readiness = max(0, int(unit.readiness) - recovery)
		unit.end_turn()
	last_invalid_reason = ""
	if unit == null or unit.control == "human":
		var command_type = last_command_result.get("type", "")
		if not ["attack", "skill", "heal", "tool", "combo"].has(command_type):
			last_feedback_message = "回合结束"
	if turn_order.is_empty():
		return
	turn_sequence += 1
	turn_count += 1
	_apply_endgame_pressure()
	current_active = null
	_select_next_active()
	if outcome == "pending":
		_start_active_turn()
	changed.emit()

func _recovery_for_completed_turn(unit) -> int:
	var command_type = last_command_result.get("type", "")
	if command_type == "combo":
		return RECOVERY_COMBO
	if unit.moved and unit.acted:
		return RECOVERY_MOVE_ACTION
	if unit.acted:
		return RECOVERY_ACTION
	if unit.tool_used:
		return RECOVERY_TOOL
	if unit.moved:
		return RECOVERY_MOVE
	return RECOVERY_WAIT

func _auto_facing_for_unit(unit) -> String:
	var enemies = units.filter(func(candidate): return candidate.is_alive() and candidate.team != unit.team)
	if enemies.is_empty():
		return unit.facing
	var nearest = enemies[0]
	var best_distance = grid.distance(unit.grid_pos, nearest.grid_pos)
	for enemy in enemies:
		var distance = grid.distance(unit.grid_pos, enemy.grid_pos)
		if distance < best_distance:
			nearest = enemy
			best_distance = distance
	return _direction_toward(unit.grid_pos, nearest.grid_pos, unit.facing)

func _direction_toward(from: Vector2i, to: Vector2i, fallback: String = "S") -> String:
	var delta = to - from
	if delta == Vector2i.ZERO:
		return fallback
	if abs(delta.x) > abs(delta.y):
		return "E" if delta.x > 0 else "W"
	return "S" if delta.y > 0 else "N"

func unit_at(tile: Vector2i):
	for unit in units:
		if unit.is_alive() and unit.grid_pos == tile:
			return unit
	return null

func units_for_team(team: String) -> Array:
	return units.filter(func(unit): return unit.team == team)

func append_log(message: String) -> void:
	log_entries.append(message)
	if log_entries.size() > 10:
		log_entries.pop_front()
	DebugLog.add(message)

func _record_event(event: Dictionary, show_recent: bool = true, write_log: bool = true) -> Dictionary:
	_event_sequence += 1
	var normalized = event.duplicate(true)
	normalized["id"] = _event_sequence
	normalized["turn"] = turn_count
	if normalized.has("source") and typeof(normalized.get("source")) == TYPE_OBJECT:
		normalized["source"] = _unit_event_data(normalized.get("source"))
	if normalized.has("target") and typeof(normalized.get("target")) == TYPE_OBJECT:
		normalized["target"] = _unit_event_data(normalized.get("target"))
	if not normalized.has("summary"):
		normalized["summary"] = _event_summary(normalized)
	battle_events.append(normalized)
	if battle_events.size() > 20:
		battle_events.pop_front()
	if show_recent:
		recent_event = normalized
		last_feedback_message = normalized.get("summary", last_feedback_message)
	if write_log:
		append_log(normalized.get("summary", ""))
	return normalized

func _event_from_action(unit, target, action_label: String, kind: String, result: Dictionary, knock: Dictionary, action: Dictionary) -> Dictionary:
	var event = {
		"kind": kind,
		"source": _unit_event_data(unit),
		"target": _unit_event_data(target),
		"action_label": action_label,
		"mode": action.get("type", kind),
		"damage": int(result.get("damage", 0)) + int(knock.get("collision_damage", 0)) + int(knock.get("fall_damage", 0)),
		"healing": int(result.get("healing", 0)),
		"status": result.get("status", action.get("module", {}).get("status", "")),
		"knockback": int(knock.get("travelled", 0)),
		"participants": result.get("participants", []),
		"missed": bool(result.get("missed", false)),
		"hit_chance": int(result.get("hit_chance", result.get("chance", 0))),
		"roll": int(result.get("roll", 0)),
		"facing_arc": result.get("facing_arc", result.get("arc", "")),
		"defeated": bool(result.get("defeated", false))
	}
	event["summary"] = _event_summary(event)
	return event

func _event_summary(event: Dictionary) -> String:
	var source = event.get("source", {})
	var target = event.get("target", {})
	var source_name = source.get("name", "裂隙压力") if source is Dictionary else "裂隙压力"
	var target_name = target.get("name", "") if target is Dictionary else ""
	var action_label = event.get("action_label", _mode_label(event.get("mode", "")))
	var parts: Array = []
	if not target_name.is_empty():
		parts.append("%s 对 %s 使用%s" % [source_name, target_name, action_label])
	else:
		parts.append("%s: %s" % [source_name, action_label])
	if int(event.get("damage", 0)) > 0:
		parts.append("伤害%s" % event.get("damage", 0))
	if bool(event.get("missed", false)):
		parts.append("未命中")
	elif int(event.get("hit_chance", 0)) > 0:
		parts.append("命中%s%%" % event.get("hit_chance", 0))
	if int(event.get("healing", 0)) > 0:
		parts.append("治疗%s" % event.get("healing", 0))
	if not String(event.get("status", "")).is_empty():
		parts.append("状态:%s" % event.get("status", ""))
	if int(event.get("knockback", 0)) > 0:
		parts.append("击退%s格" % event.get("knockback", 0))
	var participants: Array = event.get("participants", [])
	if not participants.is_empty():
		parts.append("协同%s" % participants.size())
	if bool(event.get("defeated", false)):
		parts.append("击破")
	return " | ".join(parts)

func _unit_event_data(unit) -> Dictionary:
	if unit == null:
		return {}
	return {
		"id": unit.id,
		"name": unit.display_name(),
		"team": unit.team,
		"control": unit.control,
		"pos": unit.grid_pos,
		"hp": unit.hp,
		"max_hp": unit.max_hp
	}

func _choose_forecast_preview(previews: Array, tile: Vector2i) -> Dictionary:
	var candidate_tiles: Array = []
	if tile.x >= 0:
		candidate_tiles.append(tile)
	if selected_tile.x >= 0:
		candidate_tiles.append(selected_tile)
	if hovered_tile.x >= 0:
		candidate_tiles.append(hovered_tile)
	for candidate in candidate_tiles:
		for preview in previews:
			if preview.get("pos", Vector2i(-1, -1)) == candidate:
				return preview
	if not previews.is_empty():
		return previews[0]
	return {}

func _forecast_for_action(unit, target, action: Dictionary, mode: String) -> Dictionary:
	var module = action.get("module", {})
	var action_type = action.get("type", mode)
	var action_label = "基础攻击" if action_type == "attack" else module.get("name", _mode_label(mode))
	var forecast = {
		"mode": mode,
		"type": action_type,
		"action_label": action_label,
		"source_id": unit.id,
		"source_name": unit.display_name(),
		"target_id": target.id,
		"target_name": target.display_name(),
		"range": int(module.get("range", 1)) if not module.is_empty() else 1,
		"target_rule": _module_target_rule(module, mode) if not module.is_empty() else "敌方",
		"line_of_sight": bool(module.get("line_of_sight", false)),
		"cost": int(module.get("cost", action.get("cost", 0))),
		"damage": 0,
		"healing": 0,
		"status": "",
		"knockback": 0,
		"hit_chance": 0,
		"hit_modifiers": [],
		"facing_arc": "",
		"participants": []
	}
	if ["attack", "skill"].has(action_type):
		var power = int(module.get("power", 0))
		forecast["damage"] = ActionResolverScript.estimate_attack_damage(unit, target, grid, power, module.get("id", action.get("module_id", "strike")))
		forecast["status"] = module.get("status", "")
		forecast["knockback"] = int(module.get("knockback", 1 if action.get("module_id", "") == "shield_bash" else 0))
		var hit = ActionResolverScript.hit_forecast(unit, target, grid, module if not module.is_empty() else _module_by_id(action.get("module_id", "strike")))
		forecast["hit_chance"] = hit.get("chance", 0)
		forecast["hit_modifiers"] = hit.get("modifiers", [])
		forecast["facing_arc"] = hit.get("arc", "")
	elif ["heal", "tool"].has(action_type):
		var heal_amount = int(module.get("heal", 0))
		forecast["healing"] = min(heal_amount, max(0, target.max_hp - target.hp))
	elif action_type == "combo":
		var participants = _combo_participants_for_target(unit, target, module)
		var total = unit.attack + 2
		for ally in participants:
			total += max(2, int(ally.attack * 0.5))
		forecast["damage"] = max(1, total - target.defense)
		forecast["participants"] = participants.map(func(ally): return ally.display_name())
		var combo_hit = ActionResolverScript.hit_forecast(unit, target, grid, module)
		forecast["hit_chance"] = combo_hit.get("chance", 0)
		forecast["hit_modifiers"] = combo_hit.get("modifiers", [])
		forecast["facing_arc"] = combo_hit.get("arc", "")
	forecast["summary"] = _forecast_summary(forecast)
	return forecast

func _forecast_blocked(mode: String, reason: String) -> Dictionary:
	return {
		"mode": mode,
		"blocked": true,
		"reason": reason,
		"summary": "预判: %s" % reason
	}

func _forecast_summary(forecast: Dictionary) -> String:
	var parts: Array = [
		"预判: %s -> %s" % [forecast.get("action_label", _mode_label(forecast.get("mode", ""))), forecast.get("target_name", "目标")]
	]
	if int(forecast.get("damage", 0)) > 0:
		parts.append("预计伤害%s" % forecast.get("damage", 0))
	if int(forecast.get("hit_chance", 0)) > 0:
		parts.append("命中%s%%" % forecast.get("hit_chance", 0))
		var mods: Array = forecast.get("hit_modifiers", [])
		if not mods.is_empty():
			parts.append("修正:%s" % "、".join(mods))
	if int(forecast.get("healing", 0)) > 0:
		parts.append("预计治疗%s" % forecast.get("healing", 0))
	if not String(forecast.get("status", "")).is_empty():
		parts.append("状态:%s" % forecast.get("status", ""))
	if int(forecast.get("knockback", 0)) > 0:
		parts.append("击退%s格" % forecast.get("knockback", 0))
	if int(forecast.get("cost", 0)) > 0:
		parts.append("消耗%s" % forecast.get("cost", 0))
	var participants: Array = forecast.get("participants", [])
	if not participants.is_empty():
		parts.append("参与:%s" % "、".join(participants))
	elif forecast.get("type", "") == "combo":
		parts.append("参与:暂无")
	if bool(forecast.get("line_of_sight", false)):
		parts.append("需视线")
	return " | ".join(parts)

func _target_blocker_for_mode(unit, mode: String) -> String:
	if unit == null:
		return "没有当前单位"
	if grid.action_blocked_at(unit.grid_pos, mode):
		return "当前位置地形禁止%s" % _mode_label(mode)
	if mode == "tool" and not unit.can_use_tool():
		return "道具机会已用"
	if ["attack", "skill", "combo"].has(mode) and not unit.can_act():
		return "行动机会已用"
	if ["skill", "tool", "combo"].has(mode) and available_modules_for_mode(mode, unit).is_empty():
		return "没有可用%s模块" % _mode_label(mode)
	var module = selected_module_definition(mode)
	var range_value = 1 if mode == "attack" else int(module.get("range", 1))
	if mode == "combo":
		var combo_cost = int(module.get("cost", 1)) if not module.is_empty() else 1
		if combo_resource < combo_cost:
			return "连携值不足，需要%s" % combo_cost
		var hostiles = units.filter(func(candidate): return candidate.is_alive() and candidate.team != unit.team)
		if hostiles.is_empty():
			return "没有敌方目标"
		if not hostiles.any(func(candidate): return grid.distance(unit.grid_pos, candidate.grid_pos) <= range_value):
			return "敌方目标不在连携范围内"
		return "缺少合法连携目标"
	if mode == "tool" or (mode == "skill" and not module.is_empty() and module.get("kind", "") == "heal"):
		var allies = units.filter(func(candidate): return candidate.is_alive() and candidate.team == unit.team and candidate != unit)
		var damaged = allies.filter(func(candidate): return candidate.hp < candidate.max_hp)
		if damaged.is_empty():
			return "没有受伤友方"
		if not damaged.any(func(candidate): return grid.distance(unit.grid_pos, candidate.grid_pos) <= range_value):
			return "受伤友方不在范围内"
		return "没有可治疗目标"
	var enemies = units.filter(func(candidate): return candidate.is_alive() and candidate.team != unit.team)
	if enemies.is_empty():
		return "没有敌方目标"
	var visible_enemies = enemies.filter(func(candidate): return is_unit_visible_to_unit(unit, candidate))
	if visible_enemies.is_empty():
		return "敌方在视野外"
	if not enemies.any(func(candidate): return grid.distance(unit.grid_pos, candidate.grid_pos) <= range_value):
		return "敌方目标不在范围内"
	var blocked = grid.projectile_blocker(unit.grid_pos, visible_enemies[0].grid_pos)
	if not blocked.is_empty():
		var object = blocked.get("object", {})
		return "弹道被%s阻挡" % object.get("kind", "障碍物")
	return "没有合法目标"

func _combo_participants_for_target(unit, target, module: Dictionary) -> Array:
	var participation_range = int(module.get("participation_range", 3))
	return units_for_team(unit.team).filter(func(ally):
		return ally != unit and ally.is_alive() and grid.distance(ally.grid_pos, target.grid_pos) <= participation_range
	)

func _role_summary_for_unit(unit) -> Dictionary:
	match unit.chassis_id:
		"support":
			return {"title": "支援", "role": "support", "summary": "治疗和道具优先，补足队友生命后再参与连携。"}
		"controller":
			return {"title": "控制", "role": "controller", "summary": "用缠根限制敌人位置，给队友创造安全攻击窗口。"}
		"caster":
			return {"title": "术士", "role": "caster", "summary": "远程爆发输出，优先找视线清楚的脆弱目标。"}
		"skirmisher":
			return {"title": "游击", "role": "skirmisher", "summary": "机动牵制和远程定身，适合补刀或启动连携。"}
	return {"title": "先锋", "role": "vanguard", "summary": "近战承压和击退，负责贴近敌人打开站位。"}

func _module_by_id(module_id: String) -> Dictionary:
	for module in ContentRegistry.get_items("modules"):
		if module.get("id", "") == module_id:
			return module
	return {}

func _execute_ai_turn(unit) -> void:
	var plan: Dictionary = AiPlannerScript.choose_plan(self, unit)
	if plan.get("type", "") == "action":
		_try_action_unit_at(unit, plan.get("mode", "attack"), plan.get("target_tile", unit.grid_pos))
	elif plan.get("type", "") == "move":
		_try_move_unit(unit, plan.get("position", unit.grid_pos))
	else:
		append_log("%s 待机" % unit.display_name())
	_check_outcome()
	if outcome == "pending":
		_complete_turn("ai")

func _check_outcome() -> void:
	if outcome != "pending":
		return
	var players_alive = units_for_team("player").any(func(unit): return unit.is_alive())
	var enemies_alive = units_for_team("enemy").any(func(unit): return unit.is_alive())
	if not players_alive:
		outcome = "defeat"
		_finish([], ["squad-wipe"], [])
	elif not enemies_alive:
		outcome = "victory"
		_finish(["rift-shard", "module-cache"], [], [])

func _apply_endgame_pressure() -> void:
	if turn_count < late_threshold:
		return
	mission_state["pressure_stage"] = int(mission_state.get("pressure_stage", 0)) + 1
	append_log("裂隙压力上升: 阶段%s" % mission_state["pressure_stage"])
	for unit in units:
		if unit.is_alive():
			var damage = unit.apply_damage(int(mission_state["pressure_stage"]))
			_record_event({
				"kind": "pressure",
				"source": {"id": "rift_pressure", "name": "裂隙压力", "team": "neutral", "pos": unit.grid_pos},
				"target": unit,
				"action_label": "压力伤害",
				"damage": damage,
				"summary": "裂隙压力伤害 %s -%s" % [unit.display_name(), damage]
			}, true, false)
	if int(mission_state["pressure_stage"]) >= 4:
		mission_state["collapsed"] = true
		outcome = "forced"
		_finish(["partial-data"], ["rift-collapse"], [])
	else:
		_check_outcome()

func _finish(rewards: Array, losses: Array, extracted: Array = []) -> void:
	var survivors: Array = units.filter(func(unit): return unit.is_alive()).map(func(unit): return unit.id)
	var result = {
		"outcome": outcome,
		"rewards": rewards,
		"losses": losses,
		"turns": turn_count,
		"survivors": survivors,
		"extracted": extracted
	}
	RunState.complete_battle(result)
	finished.emit(result)

func diagnostics_snapshot() -> Dictionary:
	var active = active_unit()
	var selected_unit = unit_at(selected_tile)
	return {
		"turn": turn_count,
		"active": _unit_debug(active),
		"selected_unit": _unit_debug(selected_unit),
		"turn_order": upcoming_turn_lines(),
		"awaiting_facing": awaiting_facing,
		"selected_facing": selected_facing,
		"visible_count": player_visible_positions().size(),
		"explored_count": player_explored_positions().size(),
		"selected_tile": _tile_debug(selected_tile),
			"hovered_tile": _tile_debug(hovered_tile),
			"move_preview_count": movement_preview_for_active().size(),
			"target_preview_count": target_preview_for_active(current_mode).size(),
			"range_preview_count": action_range_positions_for_active(current_mode).size(),
			"selected_path": selected_path,
			"mode": current_mode,
			"selected_module": selected_module_summary(current_mode),
			"forecast": selected_action_forecast(current_mode),
			"role_summary": active_role_summary(),
			"recent_event": recent_battle_event(),
			"combo": combo_resource,
		"combo_eligibility": combo_eligibility_lines(),
		"mission": mission_state.duplicate(),
		"invalid_reason": last_invalid_reason,
		"log": log_entries.duplicate()
	}

func upcoming_turn_lines(limit: int = 8) -> Array:
	_rebuild_turn_order()
	var result: Array = []
	var count = min(limit, turn_order.size())
	for i in range(count):
		var unit = turn_order[i]
		result.append("%s%s HP%s SPD%s CT%s R%s" % [
			"*" if unit == current_active else "-",
			unit.display_name(),
			unit.hp,
			unit.speed,
			unit.readiness,
			unit.last_turn_recovery
		])
	return result

func combo_eligibility_lines() -> Array:
	var unit = active_unit()
	var result: Array = []
	if unit == null:
		return result
	var module = selected_module_definition("combo")
	if combo_resource < int(module.get("cost", 1)):
		result.append("连携值不足: %s/%s" % [combo_resource, int(module.get("cost", 1))])
	for preview in target_preview_for_unit(unit, "combo"):
		var target = preview.get("unit")
		var eligible = _combo_participants_for_target(unit, target, module)
		var names = eligible.map(func(ally): return ally.display_name())
		result.append("%s: %s" % [target.display_name(), "、".join(names) if not names.is_empty() else "暂无参与者"])
	if result.is_empty():
		result.append(_target_blocker_for_mode(unit, "combo"))
	return result

func _unit_debug(unit) -> Dictionary:
	if unit == null:
		return {}
	return {
		"id": unit.id,
		"label": unit.display_name(),
		"team": unit.team,
		"squad": unit.squad_id,
		"control": unit.control,
		"hp": unit.hp,
		"max_hp": unit.max_hp,
		"chassis": unit.chassis_id,
		"role": unit.role,
		"move": unit.move,
		"jump": unit.jump,
		"speed": unit.speed,
		"readiness": unit.readiness,
		"last_turn_recovery": unit.last_turn_recovery,
		"sight_range": unit.sight_range,
		"visibility_group": unit.visibility_group,
		"facing": unit.facing,
		"pos": unit.grid_pos,
		"statuses": unit.statuses.duplicate(),
		"can_move": unit.can_move(),
		"can_act": unit.can_act(),
		"can_use_tool": unit.can_use_tool(),
		"moved": unit.moved,
		"acted": unit.acted,
		"tool_used": unit.tool_used
	}

func _tile_debug(tile: Vector2i) -> Dictionary:
	if tile.x < 0:
		return {}
	return {
		"x": tile.x,
		"y": tile.y,
		"terrain": grid.terrain_at(tile),
		"height": grid.height_at(tile),
		"passable": grid.is_passable(tile),
		"visible": is_tile_visible_to_group(tile),
		"explored": is_tile_explored_by_group(tile),
		"object": grid.object_at(tile),
		"objective": grid.objective_at(tile),
		"occupant": unit_at(tile).id if unit_at(tile) else ""
	}

func _reject(reason: String) -> Dictionary:
	last_invalid_reason = reason
	last_feedback_message = invalid_reason_label(reason)
	last_command_result = {"ok": false, "reason": reason}
	append_log("被拒绝: %s" % reason)
	_record_event({
		"kind": "invalid",
		"source": active_unit(),
		"action_label": "指令无效",
		"summary": "无法执行: %s" % invalid_reason_label(reason)
	}, true, false)
	changed.emit()
	return last_command_result

func invalid_reason_label(reason: String = "") -> String:
	var use_reason = last_invalid_reason if reason.is_empty() else reason
	var labels = {
		"no-active-unit": "没有当前单位",
		"wrong-turn": "还没轮到这个单位",
		"movement-spent": "移动机会已用",
		"tool-spent": "道具机会已用",
		"action-spent": "行动机会已用",
		"invalid-target": "目标无效：检查射程、阵营或视线",
		"facing-required": "请先选择结束朝向",
		"invalid-facing": "朝向无效",
		"terrain-action-blocked": "当前位置地形禁止行动",
		"extraction-locked": "撤离尚未解锁",
		"no-objective": "当前位置没有可交互目标"
	}
	return labels.get(use_reason, use_reason)

func feedback_text() -> String:
	if not last_invalid_reason.is_empty():
		return invalid_reason_label(last_invalid_reason)
	if not last_feedback_message.is_empty():
		return last_feedback_message
	return "正常"

func _range_for_mode(unit, mode: String) -> int:
	if unit == null:
		return 0
	if mode == "attack":
		return 1 if unit.can_act() else 0
	var module = selected_module_definition(mode)
	if module.is_empty():
		return 0
	return int(module.get("range", 1))

func _module_target_rule(module: Dictionary, mode: String) -> String:
	if mode == "combo":
		return "敌方"
	match module.get("kind", ""):
		"heal", "item":
			return "友方"
	return "敌方"

func _module_effect_summary(module: Dictionary, mode: String) -> String:
	var parts: Array = []
	match module.get("id", ""):
		"strike":
			parts.append("近战基础伤害")
		"shield_bash":
			parts.append("先锋近战压制")
		"root_shot":
			parts.append("远程控制")
		"fireball":
			parts.append("远程爆发")
		"heal":
			parts.append("支援治疗")
		"field_kit":
			parts.append("道具治疗，不消耗攻击")
		"rift_combo":
			parts.append("多人协同爆发")
	if module.has("power"):
		parts.append("伤害+%s" % module.get("power", 0))
	if module.has("heal"):
		parts.append("治疗%s" % module.get("heal", 0))
	if module.has("status"):
		parts.append("状态:%s" % module.get("status", ""))
	if module.has("knockback"):
		parts.append("击退%s" % module.get("knockback", 0))
	if mode == "combo":
		parts.append("消耗%s" % module.get("cost", 1))
	if parts.is_empty():
		return module.get("name", _mode_label(mode))
	return " / ".join(parts)

func _mode_label(mode: String) -> String:
	var labels = {
		"move": "移动",
		"attack": "攻击",
		"skill": "技能",
		"tool": "道具",
		"combo": "连携",
		"interact": "交互"
	}
	return labels.get(mode, mode)

func _update_facing_from_movement(unit, from: Vector2i, to: Vector2i) -> void:
	var delta = to - from
	if abs(delta.x) > abs(delta.y):
		unit.facing = "E" if delta.x > 0 else "W"
	elif delta.y != 0:
		unit.facing = "S" if delta.y > 0 else "N"
