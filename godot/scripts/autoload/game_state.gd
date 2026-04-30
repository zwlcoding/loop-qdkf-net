extends Node

signal selected_squad_changed

var selected_squad: Array = []
var unlocked_unit_ids: Array = ["vanguard", "skirmisher", "support", "controller", "caster"]
var settings = {
	"portrait_width": 390,
	"portrait_height": 844,
	"music_enabled": true,
	"sfx_enabled": true
}
var last_result = {}

func reset_to_default_squad() -> void:
	selected_squad = ["vanguard", "skirmisher", "support"]
	selected_squad_changed.emit()

func set_selected_squad(unit_ids: Array) -> void:
	selected_squad = unit_ids.slice(0, 3)
	selected_squad_changed.emit()

func ensure_squad() -> void:
	if selected_squad.size() != 3:
		reset_to_default_squad()

