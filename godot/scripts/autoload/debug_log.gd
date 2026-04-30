extends Node

var entries: Array = []
const MAX_ENTRIES = 32

func add(message: String) -> void:
	entries.append(message)
	if entries.size() > MAX_ENTRIES:
		entries.pop_front()
	print(message)

func latest(limit: int = 8) -> Array:
	var start: int = max(0, entries.size() - limit)
	return entries.slice(start, entries.size())

func clear() -> void:
	entries.clear()

