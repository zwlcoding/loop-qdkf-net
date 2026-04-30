extends Control
class_name BattleBoard

signal tile_pressed(tile)

const Palette = preload("res://scripts/ui/palette.gd")

var controller
var mode = "move"
var reachable: Array = []
var action_ranges: Array = []
var targets: Array = []
var visible_tiles: Array = []
var explored_tiles: Array = []
var camera_offset = Vector2.ZERO
var selected_tile = Vector2i(-1, -1)
var _pulse_time: float = 0.0
var _visual_event_id = -1
var _visual_timer: float = 99.0
const VISUAL_DURATION = 1.4

func _process(delta: float) -> void:
	if reachable.size() > 0 or action_ranges.size() > 0 or targets.size() > 0 or _visual_timer < VISUAL_DURATION:
		_pulse_time += delta
		_visual_timer += delta
		queue_redraw()

func bind(next_controller) -> void:
	controller = next_controller
	controller.changed.connect(_on_controller_changed)
	_on_controller_changed()

func _on_controller_changed() -> void:
	if controller:
		reachable = controller.preview_positions("move")
		action_ranges = controller.action_range_positions_for_active(controller.current_mode)
		targets = controller.target_preview_for_active(controller.current_mode).map(func(item): return item.get("pos", Vector2i(-1, -1)))
		visible_tiles = controller.player_visible_positions()
		explored_tiles = controller.player_explored_positions()
		var event = controller.recent_battle_event()
		var next_event_id = int(event.get("id", -1))
		if next_event_id != _visual_event_id:
			_visual_event_id = next_event_id
			_visual_timer = 0.0
	_update_camera()
	queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_update_camera()
		queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var local = event.position - camera_offset
		var tile = _hit_tile(local)
		if tile.x >= 0:
			selected_tile = tile
			if controller:
				controller.selected_tile = tile
			tile_pressed.emit(tile)
			queue_redraw()
	if event is InputEventMouseMotion:
		var hover_tile = _hit_tile(event.position - camera_offset)
		if controller:
			controller.hovered_tile = hover_tile
	if event is InputEventScreenTouch and event.pressed:
		var tile = _hit_tile(event.position - camera_offset)
		if tile.x >= 0:
			selected_tile = tile
			if controller:
				controller.selected_tile = tile
			tile_pressed.emit(tile)
			queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Palette.PANEL_DARK, true)
	if controller == null:
		return
	var positions = controller.grid.all_positions()
	positions.sort_custom(func(a, b): return a.x + a.y < b.x + b.y)
	for pos in positions:
		_draw_tile(pos)
	_draw_units()
	_draw_recent_event_feedback()

func _draw_tile(pos: Vector2i) -> void:
	var grid = controller.grid
	var center = grid.tile_to_world(pos) + camera_offset
	var terrain_id = grid.terrain_at(pos)
	var color: Color = Palette.TERRAIN.get(terrain_id, Color.DIM_GRAY)
	var half_w = grid.tile_width * 0.5
	var half_h = grid.tile_height * 0.5
	var top = PackedVector2Array([
		center + Vector2(0, -half_h),
		center + Vector2(half_w, 0),
		center + Vector2(0, half_h),
		center + Vector2(-half_w, 0)
	])
	var lower = grid.height_at(pos) * grid.level_height
	if lower > 0:
		var side_color = color.darkened(0.35)
		var front = PackedVector2Array([
			center + Vector2(-half_w, 0),
			center + Vector2(0, half_h),
			center + Vector2(0, half_h + lower),
			center + Vector2(-half_w, lower)
		])
		var right = PackedVector2Array([
			center + Vector2(half_w, 0),
			center + Vector2(0, half_h),
			center + Vector2(0, half_h + lower),
			center + Vector2(half_w, lower)
		])
		draw_colored_polygon(front, side_color)
		draw_colored_polygon(right, side_color.darkened(0.1))
	draw_colored_polygon(top, color)
	if not explored_tiles.has(pos):
		draw_colored_polygon(top, Color(0.01, 0.02, 0.04, 0.82))
	elif not visible_tiles.has(pos):
		draw_colored_polygon(top, Color(0.02, 0.03, 0.05, 0.48))
	var border = Color("#0b1020")
	draw_polyline(top + PackedVector2Array([top[0]]), border, 1.5)
	if not grid.is_passable(pos):
		draw_colored_polygon(top, Color(0.0, 0.0, 0.0, 0.35))
		draw_line(top[0], top[2], Color(0.8, 0.2, 0.2, 0.5), 2.0)
		draw_line(top[1], top[3], Color(0.8, 0.2, 0.2, 0.5), 2.0)
	if controller and controller.selected_path.has(pos):
		var is_endpoint = controller.selected_path.size() > 0 and controller.selected_path[-1] == pos
		draw_colored_polygon(top, Color(1.0, 0.82, 0.12, 0.48 if is_endpoint else 0.32))
		draw_polyline(top + PackedVector2Array([top[0]]), Color(1.0, 0.92, 0.35, 0.9), 3.0 if is_endpoint else 2.0)
		_draw_glyph(center, "endpoint" if is_endpoint else "path", Color(1.0, 0.92, 0.35, 0.95))
	elif reachable.has(pos):
		var pulse = 0.44 + 0.18 * (0.5 + 0.5 * sin(_pulse_time * 4.0))
		draw_colored_polygon(top, Color(0.0, 0.98, 0.78, pulse))
		draw_polyline(top + PackedVector2Array([top[0]]), Color(0.68, 1.0, 0.92, 0.92), 2.8)
		_draw_glyph(center, "move", Color(0.82, 1.0, 0.94, 0.95))
	if mode != "move" and action_ranges.has(pos) and not targets.has(pos):
		var range_color = _preview_color(mode, false)
		draw_colored_polygon(top, Color(range_color.r, range_color.g, range_color.b, 0.18))
		draw_polyline(top + PackedVector2Array([top[0]]), Color(range_color.r, range_color.g, range_color.b, 0.45), 1.6)
		_draw_glyph(center, "range", Color(range_color.r, range_color.g, range_color.b, 0.55))
	if targets.has(pos):
		var target_color = _preview_color(mode, true)
		draw_colored_polygon(top, Color(target_color.r, target_color.g, target_color.b, 0.44))
		draw_polyline(top + PackedVector2Array([top[0]]), Color(target_color.r, target_color.g, target_color.b, 0.95), 3.2)
		_draw_glyph(center, _target_glyph(mode), Color(target_color.r, target_color.g, target_color.b, 1.0))
	if selected_tile == pos:
		draw_polyline(top + PackedVector2Array([top[0]]), Palette.YELLOW, 3.0)
	var objective = grid.objective_at(pos)
	if not objective.is_empty():
		draw_circle(center, 8, Palette.ORANGE if objective == "extraction" else Palette.VIOLET)
	var object = grid.object_at(pos)
	if not object.is_empty() and explored_tiles.has(pos) and int(object.get("durability", 1)) != 0:
		var object_color = Color("#2f7d46") if object.get("kind", "") == "tree" else Color("#7b6f5a")
		draw_circle(center + Vector2(0, -8), 11, object_color)
		if bool(object.get("blocks_projectile", false)):
			draw_line(center + Vector2(-10, -18), center + Vector2(10, 2), Color(0, 0, 0, 0.35), 2.0)

func _draw_units() -> void:
	var alive_units = controller.units.filter(func(unit): return unit.is_alive())
	alive_units.sort_custom(func(a, b): return a.grid_pos.x + a.grid_pos.y < b.grid_pos.x + b.grid_pos.y)
	for unit in alive_units:
		if unit.team != "player" and not controller.is_tile_visible_to_group(unit.grid_pos):
			continue
		var center = controller.grid.tile_to_world(unit.grid_pos) + camera_offset + Vector2(0, -22)
		var team_color: Color = Palette.TEAM.get(unit.team, Palette.YELLOW)
		var active = unit == controller.active_unit()
		var flash_color = _unit_event_flash_color(unit)
		draw_circle(center + Vector2(0, 18), 18, Color(0, 0, 0, 0.35))
		if active:
			draw_circle(center, 22, Palette.YELLOW)
		if flash_color.a > 0.0:
			draw_circle(center, 25, flash_color)
			draw_arc(center, 29.0, 0.0, TAU, 28, Color(flash_color.r, flash_color.g, flash_color.b, 0.95), 3.0)
		draw_circle(center, 17, team_color)
		draw_circle(center + Vector2(0, -5), 8, team_color.lightened(0.35))
		var facing = controller.selected_facing if unit == controller.active_unit() and controller.awaiting_facing else unit.facing
		draw_arc(center, 24.0, _facing_angle(facing) - 0.5, _facing_angle(facing) + 0.5, 12, Color(Palette.YELLOW.r, Palette.YELLOW.g, Palette.YELLOW.b, 0.75), 4.0)
		draw_line(center, center + _facing_vector(facing) * 22, Palette.TEXT, 3)
		var hp_ratio = float(unit.hp) / max(1.0, float(unit.max_hp))
		draw_rect(Rect2(center + Vector2(-20, 22), Vector2(40, 5)), Color("#161b2a"), true)
		draw_rect(Rect2(center + Vector2(-20, 22), Vector2(40 * hp_ratio, 5)), Palette.GREEN if hp_ratio > 0.4 else Palette.RED, true)
		var label = "%s%s" % ["电脑" if unit.control == "ai" else "", unit.label.substr(0, 2)]
		draw_string(get_theme_default_font(), center + Vector2(-20, -28), label, HORIZONTAL_ALIGNMENT_LEFT, 56, 11, Palette.TEXT)

func _draw_recent_event_feedback() -> void:
	if controller == null or _visual_timer >= VISUAL_DURATION:
		return
	var event = controller.recent_battle_event()
	if event.is_empty() or int(event.get("id", -1)) != _visual_event_id:
		return
	var target = event.get("target", {})
	if not (target is Dictionary) or not target.has("pos"):
		return
	var alpha = clamp(1.0 - (_visual_timer / VISUAL_DURATION), 0.0, 1.0)
	var target_center = _tile_center(target.get("pos")) + Vector2(0, -28 - 18 * (1.0 - alpha))
	var color = _event_color(event)
	var source = event.get("source", {})
	if source is Dictionary and source.has("pos") and source.get("pos") != target.get("pos"):
		var source_center = _tile_center(source.get("pos")) + Vector2(0, -22)
		var end_center = _tile_center(target.get("pos")) + Vector2(0, -22)
		draw_line(source_center, end_center, Color(color.r, color.g, color.b, 0.75 * alpha), 3.0)
		draw_circle(source_center, 5.0, Color(color.r, color.g, color.b, 0.85 * alpha))
	if event.get("kind", "") == "combo":
		draw_arc(_tile_center(target.get("pos")) + Vector2(0, -22), 34.0 + 5.0 * sin(_pulse_time * 6.0), 0.0, TAU, 32, Color(Palette.VIOLET.r, Palette.VIOLET.g, Palette.VIOLET.b, 0.95 * alpha), 4.0)
	else:
		draw_arc(_tile_center(target.get("pos")) + Vector2(0, -22), 28.0, 0.0, TAU, 28, Color(color.r, color.g, color.b, 0.8 * alpha), 3.0)
	var text = _event_float_text(event)
	if not text.is_empty():
		draw_string(get_theme_default_font(), target_center + Vector2(-28, 0), text, HORIZONTAL_ALIGNMENT_LEFT, 96, 16, Color(color.r, color.g, color.b, alpha))

func _unit_event_flash_color(unit) -> Color:
	if controller == null or _visual_timer >= VISUAL_DURATION:
		return Color(0, 0, 0, 0)
	var event = controller.recent_battle_event()
	var target = event.get("target", {})
	if not (target is Dictionary) or target.get("id", "") != unit.id:
		return Color(0, 0, 0, 0)
	var alpha = 0.36 * clamp(1.0 - (_visual_timer / VISUAL_DURATION), 0.0, 1.0)
	var color = _event_color(event)
	return Color(color.r, color.g, color.b, alpha)

func _event_color(event: Dictionary) -> Color:
	if event.get("kind", "") == "pressure":
		return Palette.ORANGE
	if event.get("kind", "") == "combo":
		return Palette.VIOLET
	if int(event.get("healing", 0)) > 0:
		return Palette.GREEN
	if not String(event.get("status", "")).is_empty():
		return Palette.CYAN
	if event.get("kind", "") == "invalid":
		return Palette.YELLOW
	return Palette.RED

func _event_float_text(event: Dictionary) -> String:
	if int(event.get("damage", 0)) > 0:
		return "-%s" % event.get("damage", 0)
	if int(event.get("healing", 0)) > 0:
		return "+%s" % event.get("healing", 0)
	if not String(event.get("status", "")).is_empty():
		return String(event.get("status", "")).to_upper()
	if event.get("kind", "") == "combo":
		return "COMBO"
	if event.get("kind", "") == "invalid":
		return "BLOCK"
	return ""

func _tile_center(pos: Vector2i) -> Vector2:
	return controller.grid.tile_to_world(pos) + camera_offset

func _facing_vector(facing: String) -> Vector2:
	match facing:
		"N":
			return Vector2(0, -1)
		"E":
			return Vector2(1, 0)
		"W":
			return Vector2(-1, 0)
	return Vector2(0, 1)

func _facing_angle(facing: String) -> float:
	match facing:
		"N":
			return -PI * 0.5
		"E":
			return 0.0
		"W":
			return PI
	return PI * 0.5

func _preview_color(next_mode: String, strong: bool) -> Color:
	match next_mode:
		"attack":
			return Color("#ff4f58") if strong else Color("#ff8a3d")
		"skill":
			return Color("#ff9f1c") if strong else Color("#f7d154")
		"tool":
			return Color("#35d6ff") if strong else Color("#72f2ff")
		"combo":
			return Color("#c77dff") if strong else Color("#9b7cff")
	return Color("#30d5c8")

func _target_glyph(next_mode: String) -> String:
	match next_mode:
		"tool":
			return "plus"
		"combo":
			return "combo"
		"attack", "skill":
			return "cross"
	return "range"

func _draw_glyph(center: Vector2, kind: String, color: Color) -> void:
	match kind:
		"move":
			draw_circle(center, 4.5, color)
		"path":
			draw_circle(center, 5.5, color)
		"endpoint":
			draw_circle(center, 8.0, color)
			draw_arc(center, 12.0, 0.0, TAU, 24, color, 2.0)
		"range":
			draw_arc(center, 9.0, 0.0, TAU, 20, color, 1.5)
		"cross":
			draw_line(center + Vector2(-8, -8), center + Vector2(8, 8), color, 3.0)
			draw_line(center + Vector2(8, -8), center + Vector2(-8, 8), color, 3.0)
		"plus":
			draw_line(center + Vector2(-9, 0), center + Vector2(9, 0), color, 3.2)
			draw_line(center + Vector2(0, -9), center + Vector2(0, 9), color, 3.2)
		"combo":
			draw_arc(center, 11.0, 0.0, TAU, 24, color, 3.0)
			draw_circle(center, 3.5, color)

func _hit_tile(local: Vector2) -> Vector2i:
	if controller == null:
		return Vector2i(-1, -1)
	var best = Vector2i(-1, -1)
	var best_distance = INF
	for pos in controller.grid.all_positions():
		var center = controller.grid.tile_to_world(pos)
		var half_w = controller.grid.tile_width * 0.5
		var half_h = controller.grid.tile_height * 0.5
		var normalized = abs(local.x - center.x) / half_w + abs(local.y - center.y) / half_h
		if normalized <= 1.0:
			var distance = center.distance_squared_to(local)
			if distance < best_distance:
				best_distance = distance
				best = pos
	return best

func _update_camera() -> void:
	if controller == null or size.x <= 0 or size.y <= 0:
		return
	var active = controller.active_unit()
	var focus = Vector2.ZERO
	if active:
		focus = controller.grid.tile_to_world(active.grid_pos)
	camera_offset = size * 0.5 - focus
