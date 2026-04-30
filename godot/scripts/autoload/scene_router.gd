extends Node

const SCENES = {
	"boot": "res://scenes/Boot.tscn",
	"main_menu": "res://scenes/MainMenu.tscn",
	"loadout": "res://scenes/Loadout.tscn",
	"rift_map": "res://scenes/RiftMap.tscn",
	"battle": "res://scenes/Battle.tscn",
	"loot": "res://scenes/Loot.tscn",
	"result": "res://scenes/Result.tscn"
}

func go(scene_id: String) -> void:
	var path: String = SCENES.get(scene_id, "")
	if path.is_empty():
		push_error("Unknown scene id: %s" % scene_id)
		return
	get_tree().change_scene_to_file(path)

func reload_current() -> void:
	get_tree().reload_current_scene()

