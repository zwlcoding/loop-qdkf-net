extends Node

var music_enabled = true
var sfx_enabled = true

func play_ui_click() -> void:
	if sfx_enabled:
		DebugLog.add("sfx: ui-click")

func play_event(event_id: String) -> void:
	if sfx_enabled:
		DebugLog.add("sfx: %s" % event_id)

func play_music(track_id: String) -> void:
	if music_enabled:
		DebugLog.add("music: %s" % track_id)

