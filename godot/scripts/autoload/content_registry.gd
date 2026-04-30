extends Node

const DATA_FILES = {
	"chassis": "res://data/chassis.json",
	"modules": "res://data/modules.json",
	"terrain": "res://data/terrain.json",
	"maps": "res://data/maps.json",
	"missions": "res://data/missions.json",
	"loot": "res://data/loot.json",
	"statuses": "res://data/statuses.json",
	"fixtures": "res://data/fixtures.json"
}

var data = {}
var validation_errors: Array = []

func load_all() -> bool:
	data.clear()
	validation_errors.clear()
	for key in DATA_FILES.keys():
		var path: String = DATA_FILES[key]
		if not FileAccess.file_exists(path):
			validation_errors.append("Missing data file: %s" % path)
			continue
		var file = FileAccess.open(path, FileAccess.READ)
		var parsed = JSON.parse_string(file.get_as_text())
		if parsed == null:
			validation_errors.append("Invalid JSON: %s" % path)
			continue
		data[key] = parsed
	validate()
	return validation_errors.is_empty()

func validate() -> Array:
	validation_errors.clear()
	_require_collection("chassis")
	_require_collection("modules")
	_require_collection("terrain")
	_require_collection("maps")
	_require_collection("missions")
	_require_collection("loot")
	_require_collection("statuses")
	_validate_maps()
	_validate_missions()
	_validate_fixtures()
	return validation_errors

func get_items(kind: String) -> Array:
	var collection = data.get(kind, [])
	if collection is Array:
		return collection
	return []

func by_id(kind: String, id: String) -> Dictionary:
	for item in get_items(kind):
		if item.get("id", "") == id:
			return item
	return {}

func first_id(kind: String) -> String:
	var items = get_items(kind)
	if items.is_empty():
		return ""
	return items[0].get("id", "")

func _require_collection(kind: String) -> void:
	if not data.has(kind) or not (data[kind] is Array):
		validation_errors.append("Missing collection: %s" % kind)

func _validate_maps() -> void:
	var terrain_ids = {}
	for terrain in get_items("terrain"):
		terrain_ids[terrain.get("id", "")] = true
	for map_data in get_items("maps"):
		var width = int(map_data.get("width", 0))
		var height = int(map_data.get("height", 0))
		var cells: Array = map_data.get("cells", [])
		if width <= 0 or height <= 0:
			validation_errors.append("Map has invalid dimensions: %s" % map_data.get("id", "<missing>"))
		if cells.size() != width * height:
			validation_errors.append("Map cell count mismatch: %s" % map_data.get("id", "<missing>"))
		for cell in cells:
			var terrain_id: String = cell.get("terrain", "")
			if not terrain_ids.has(terrain_id):
				validation_errors.append("Map %s references missing terrain %s" % [map_data.get("id", ""), terrain_id])

func _validate_missions() -> void:
	var map_ids = {}
	for map_data in get_items("maps"):
		map_ids[map_data.get("id", "")] = true
	for mission in get_items("missions"):
		var map_id: String = mission.get("map_id", "")
		if not map_ids.has(map_id):
			validation_errors.append("Mission %s references missing map %s" % [mission.get("id", ""), map_id])

func _validate_fixtures() -> void:
	var chassis_ids = {}
	var module_ids = {}
	var map_ids = {}
	var mission_ids = {}
	for chassis in get_items("chassis"):
		chassis_ids[chassis.get("id", "")] = true
	for module in get_items("modules"):
		module_ids[module.get("id", "")] = true
	for map_data in get_items("maps"):
		map_ids[map_data.get("id", "")] = true
	for mission in get_items("missions"):
		mission_ids[mission.get("id", "")] = true
	for fixture in get_items("fixtures"):
		if not fixture.has("battle_setup"):
			continue
		var setup: Dictionary = fixture.get("battle_setup", {})
		if not map_ids.has(setup.get("map_id", "")):
			validation_errors.append("Fixture %s references missing map %s" % [fixture.get("id", ""), setup.get("map_id", "")])
		if not mission_ids.has(setup.get("mission_id", "")):
			validation_errors.append("Fixture %s references missing mission %s" % [fixture.get("id", ""), setup.get("mission_id", "")])
		var seen_units = {}
		var seen_tiles = {}
		for squad in setup.get("squads", []):
			if not ["human", "ai"].has(squad.get("control", "")):
				validation_errors.append("Fixture %s has invalid squad control" % fixture.get("id", ""))
			for unit in squad.get("units", []):
				var unit_id: String = unit.get("id", "")
				if seen_units.has(unit_id):
					validation_errors.append("Fixture %s duplicate unit %s" % [fixture.get("id", ""), unit_id])
				seen_units[unit_id] = true
				if not chassis_ids.has(unit.get("chassis", "")):
					validation_errors.append("Fixture %s unit %s missing chassis %s" % [fixture.get("id", ""), unit_id, unit.get("chassis", "")])
				var tile_key = "%s,%s" % [unit.get("x", -1), unit.get("y", -1)]
				if seen_tiles.has(tile_key):
					validation_errors.append("Fixture %s duplicate spawn %s" % [fixture.get("id", ""), tile_key])
				seen_tiles[tile_key] = true
				for module_id in unit.get("modules", []):
					if not module_ids.has(module_id):
						validation_errors.append("Fixture %s unit %s missing module %s" % [fixture.get("id", ""), unit_id, module_id])
