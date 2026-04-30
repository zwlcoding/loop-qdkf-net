extends Node

var current_mission_id = ""
var current_map_id = ""
var rewards: Array = []
var losses: Array = []
var outcome = "pending"
var turn_count = 0

func start_run(mission_id: String, map_id: String) -> void:
	current_mission_id = mission_id
	current_map_id = map_id
	rewards = []
	losses = []
	outcome = "pending"
	turn_count = 0

func complete_battle(result: Dictionary) -> void:
	outcome = result.get("outcome", "unknown")
	rewards = result.get("rewards", [])
	losses = result.get("losses", [])
	turn_count = result.get("turns", 0)
	GameState.last_result = result

func clear() -> void:
	current_mission_id = ""
	current_map_id = ""
	rewards = []
	losses = []
	outcome = "pending"
	turn_count = 0

