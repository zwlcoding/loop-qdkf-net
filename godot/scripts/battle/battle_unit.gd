extends RefCounted
class_name BattleUnit

var id = ""
var label = ""
var name = ""
var team = "neutral"
var squad_id = -1
var squad_name = ""
var control = "human"
var chassis_id = ""
var role = ""
var hp = 1
var max_hp = 1
var attack = 1
var defense = 0
var move = 3
var jump = 1
var speed = 5
var readiness = 0
var sight_range = 6
var visibility_group = ""
var last_turn_recovery = 0
var facing = "S"
var grid_pos = Vector2i.ZERO
var statuses: Array = []
var modules: Array = []
var acted = false
var moved = false
var tool_used = false
var turn_active = false

func is_alive() -> bool:
	return hp > 0

func apply_damage(amount: int) -> int:
	var final_amount: int = max(1, amount)
	hp = max(0, hp - final_amount)
	return final_amount

func heal(amount: int) -> int:
	var before = hp
	hp = min(max_hp, hp + amount)
	return hp - before

func reset_turn_flags() -> void:
	acted = false
	moved = false
	tool_used = false
	turn_active = true

func end_turn() -> void:
	turn_active = false

func can_move() -> bool:
	return turn_active and is_alive() and not moved and not statuses.has("root") and not statuses.has("stun")

func can_act() -> bool:
	return turn_active and is_alive() and not acted and not statuses.has("stun")

func can_use_tool() -> bool:
	return turn_active and is_alive() and not tool_used

func has_module_kind(kind: String, module_defs: Array) -> bool:
	for module_id in modules:
		var module = _module_by_id(module_defs, module_id)
		if module.get("kind", "") == kind:
			return true
	return false

func modules_for_kind(kind: String, module_defs: Array) -> Array:
	var result: Array = []
	for module_id in modules:
		var module = _module_by_id(module_defs, module_id)
		if module.get("kind", "") == kind:
			result.append(module)
	return result

func add_status(status_id: String) -> void:
	if not statuses.has(status_id):
		statuses.append(status_id)

func display_name() -> String:
	if not label.is_empty():
		return label
	return name if not name.is_empty() else id

func _module_by_id(module_defs: Array, module_id: String) -> Dictionary:
	for module in module_defs:
		if module.get("id", "") == module_id:
			return module
	return {}
